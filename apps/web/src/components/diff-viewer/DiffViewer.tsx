import { useMemo, useState } from 'react';
import { FileText, AlertCircle, MessageSquare } from 'lucide-react';
import { findFilePatch, parseUnifiedDiff } from '@/utils/parse-diff';
import type { ReviewResult, ReviewComment, ReviewJobArtifacts } from '@/types';
import { formatConfidencePercent } from '@/types';

interface DiffViewerProps {
  filename: string | null;
  result: ReviewResult | undefined;
  artifacts?: ReviewJobArtifacts;
}

export function DiffViewer({ filename, result, artifacts }: DiffViewerProps) {
  const [showComments, setShowComments] = useState(true);

  const patch = useMemo(
    () => (filename ? findFilePatch(artifacts, filename) : null),
    [artifacts, filename],
  );

  const hunks = useMemo(
    () => (filename ? parseUnifiedDiff(filename, patch) : []),
    [filename, patch],
  );

  if (!filename) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>选择左侧文件查看 diff</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>暂无审查结果</p>
      </div>
    );
  }

  const fileComments =
    result.comments?.comments?.filter((comment) => comment.file === filename) ?? [];

  const commentLines = new Set<number>();
  for (const comment of fileComments) {
    if (comment.line != null) commentLines.add(comment.line);
    comment.mapping?.changedLines?.forEach((line) => commentLines.add(line));
  }

  const hasComments = fileComments.length > 0;
  const hasPatch = hunks.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-10 border-b bg-card/50 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate" title={filename}>
            {filename}
          </span>
        </div>
        {hasComments && (
          <button
            onClick={() => setShowComments(!showComments)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showComments
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {showComments ? '隐藏评论' : '显示评论'} ({fileComments.length})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 text-sm font-mono">
          {!hasPatch ? (
            <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
              <p className="mb-2">该文件无 diff 内容</p>
              <p className="text-xs">可能是二进制文件、过大文件，或 GitHub 未返回 patch</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hunks.map((hunk, hunkIndex) => (
                <div key={`${hunk.header}-${hunkIndex}`} className="rounded border overflow-hidden">
                  <div className="px-3 py-1.5 bg-muted text-xs text-muted-foreground border-b">
                    {hunk.header}
                  </div>
                  <div>
                    {hunk.lines.map((line, lineIndex) => {
                      const lineNo = line.newLineNumber ?? line.oldLineNumber;
                      const hasComment =
                        lineNo != null &&
                        (commentLines.has(lineNo) ||
                          fileComments.some(
                            (c) => c.line === lineNo || c.mapping?.changedLines?.includes(lineNo),
                          ));

                      const rowClass =
                        line.type === 'added'
                          ? 'diff-line-added'
                          : line.type === 'removed'
                            ? 'diff-line-removed'
                            : 'diff-line-context';

                      return (
                        <div
                          key={`${hunkIndex}-${lineIndex}`}
                          className={`flex ${rowClass} ${hasComment ? 'ring-1 ring-inset ring-primary/40' : ''}`}
                        >
                          <div className="diff-line-number w-10 text-right shrink-0 select-none">
                            {line.oldLineNumber ?? ''}
                          </div>
                          <div className="diff-line-number w-10 text-right shrink-0 select-none border-r mr-2">
                            {line.newLineNumber ?? ''}
                          </div>
                          <div className="flex-1 pr-3 whitespace-pre-wrap break-all">
                            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                            {line.content}
                          </div>
                          {hasComment && (
                            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mr-2 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showComments && hasComments && (
            <div className="mt-6 space-y-4 font-sans">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                AI 评论 ({fileComments.length})
              </h3>
              <div className="space-y-3">
                {fileComments.map((comment, index) => (
                  <CommentCard key={index} comment={comment} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentCard({ comment, index }: { comment: ReviewComment; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  const severityColors = {
    critical: 'border-red-400 bg-red-50/50',
    high: 'border-orange-400 bg-orange-50/50',
    medium: 'border-yellow-400 bg-yellow-50/50',
    low: 'border-blue-400 bg-blue-50/50',
    suggestion: 'border-gray-300 bg-muted/30',
  };

  const severity = comment.severity in severityColors ? comment.severity : 'low';

  return (
    <div className={`border-l-4 rounded-r-lg p-3 ${severityColors[severity as keyof typeof severityColors]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">
            {comment.line ? `行 ${comment.line}` : comment.symbol || '文件级'}
          </span>
          <SeverityBadge severity={comment.severity} />
          <ConfidenceBadge score={comment.confidenceScore} label={comment.confidence} />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          <p className="text-sm">{comment.comment}</p>
          {comment.suggestion && (
            <div className="bg-background/80 rounded p-2 text-sm border">
              <span className="text-xs font-medium text-muted-foreground">建议修改:</span>
              <p className="mt-1">{comment.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
    suggestion: 'bg-gray-100 text-gray-700',
  };

  const labels: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
    suggestion: '建议',
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles[severity] ?? 'bg-gray-100'}`}>
      {labels[severity] ?? severity}
    </span>
  );
}

function ConfidenceBadge({ score, label }: { score?: number; label?: string }) {
  const display = formatConfidencePercent(score, label);
  const numeric = score ?? (label === 'high' ? 0.9 : label === 'medium' ? 0.7 : label === 'low' ? 0.5 : 0);

  let color = 'bg-gray-100 text-gray-700';
  if (numeric >= 0.9) color = 'bg-green-100 text-green-700';
  else if (numeric >= 0.7) color = 'bg-blue-100 text-blue-700';
  else if (numeric >= 0.5) color = 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{display}</span>
  );
}
