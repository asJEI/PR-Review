import { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import type { ReviewResult, ReviewComment } from '@/types';

interface DiffViewerProps {
  filename: string | null;
  result: ReviewResult | undefined;
}

export function DiffViewer({ filename, result }: DiffViewerProps) {
  const [showComments, setShowComments] = useState(true);

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

  // Find comments for this file
  const fileComments = result.comments?.comments?.filter(
    (c) => c.file === filename
  ) || [];

  // Try to extract raw diff lines from reviewContext (if available)
  // For MVP, we'll show a placeholder with comments
  const hasComments = fileComments.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Placeholder for actual diff - in real implementation this would parse the unified diff */}
        <div className="p-4 text-sm text-muted-foreground">
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="mb-2">Diff 内容展示区域</p>
            <p className="text-xs">
              (需要后端接口提供原始 diff 数据)
            </p>
          </div>

          {/* Comments section */}
          {showComments && hasComments && (
            <div className="mt-6 space-y-4">
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
  };

  return (
    <div
      className={`border-l-4 rounded-r-lg p-3 ${
        severityColors[comment.severity] || 'border-gray-300 bg-muted/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {comment.line ? `行 ${comment.line}` : comment.symbol || '文件级'}
          </span>
          <SeverityBadge severity={comment.severity} />
          <ConfidenceBadge confidence={comment.confidence} />
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
              <span className="text-xs font-medium text-muted-foreground">
                建议修改:
              </span>
              <p className="mt-1">{comment.suggestion}</p>
            </div>
          )}
          {comment.mapping && (
            <p className="text-xs text-muted-foreground">
              映射置信度: {(comment.mapping.confidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  const labels = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles[severity as keyof typeof styles] || 'bg-gray-100'}`}>
      {labels[severity as keyof typeof labels] || severity}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color = 'bg-gray-100 text-gray-700';
  if (confidence >= 0.9) color = 'bg-green-100 text-green-700';
  else if (confidence >= 0.7) color = 'bg-blue-100 text-blue-700';
  else if (confidence >= 0.5) color = 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>
      {(confidence * 100).toFixed(0)}%
    </span>
  );
}
