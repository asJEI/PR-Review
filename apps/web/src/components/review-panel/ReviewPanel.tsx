import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  MessageSquare,
  Info,
  Copy,
  Check,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import type { ReviewResult, PrSummary, RiskItem, ReviewComment } from '@/types';
import { formatConfidencePercent } from '@/types';

interface ReviewPanelProps {
  result: ReviewResult | undefined;
  selectedFile: string | null;
}

export function ReviewPanel({ result, selectedFile }: ReviewPanelProps) {
  if (!result) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        暂无审查结果
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <SummarySection summary={result.summary} reliabilityScore={result.meta?.reliabilityScore} />
      <RisksSection risks={result.risks?.risks || []} />
      <CommentsSection
        comments={result.comments?.comments || []}
        selectedFile={selectedFile}
      />
      <MetaSection meta={result.meta} />
    </div>
  );
}

// Summary Section
function SummarySection({
  summary,
  reliabilityScore,
}: {
  summary: PrSummary | undefined;
  reliabilityScore?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!summary) return null;

  return (
    <div className="px-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left font-medium"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <FileText className="h-4 w-4 text-primary" />
        PR Summary
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm">
          <h3 className="font-semibold">{summary.title || 'PR 总结'}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {summary.summary || '暂无总结'}
          </p>

          {summary.keyChanges && summary.keyChanges.length > 0 && (
            <div>
              <h4 className="font-medium mb-1.5">核心变更</h4>
              <ul className="space-y-1 text-muted-foreground">
                {summary.keyChanges.map((change, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.affectedSystems && summary.affectedSystems.length > 0 && (
            <div>
              <h4 className="font-medium mb-1.5">影响模块</h4>
              <div className="flex flex-wrap gap-1.5">
                {summary.affectedSystems.map((system, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-secondary rounded text-xs"
                  >
                    {system}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.architecturalImpact && (
            <div>
              <h4 className="font-medium mb-1.5">架构影响</h4>
              <p className="text-muted-foreground">
                {summary.architecturalImpact}
              </p>
            </div>
          )}

          {typeof reliabilityScore === 'number' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">可靠性评分:</span>
              <ConfidenceBadge score={reliabilityScore} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Risks Section
function RisksSection({ risks }: { risks: RiskItem[] }) {
  const [expanded, setExpanded] = useState(true);

  if (!risks || risks.length === 0) {
    return (
      <div className="px-4 py-2">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          未识别到风险
        </div>
      </div>
    );
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedRisks = [...risks].sort(
    (a, b) =>
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder]
  );

  // Count by severity
  const criticalCount = risks.filter((r) => r.severity === 'critical').length;
  const highCount = risks.filter((r) => r.severity === 'high').length;

  return (
    <div className="px-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left font-medium"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        Risks
        <span className="text-xs font-normal text-muted-foreground ml-1">
          ({risks.length})
        </span>
        {(criticalCount > 0 || highCount > 0) && (
          <span className="ml-auto flex items-center gap-1">
            {criticalCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                严重 {criticalCount}
              </span>
            )}
            {highCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                高 {highCount}
              </span>
            )}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {sortedRisks.map((risk, index) => (
            <RiskCard key={index} risk={risk} defaultExpanded={index < 2} />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskCard({
  risk,
  defaultExpanded,
}: {
  risk: RiskItem;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const severityStyles = {
    critical: 'border-red-400 bg-red-50/50',
    high: 'border-orange-400 bg-orange-50/50',
    medium: 'border-yellow-400 bg-yellow-50/50',
    low: 'border-blue-400 bg-blue-50/50',
  };

  const severityLabels = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
  };

  return (
    <div
      className={`border-l-4 rounded-r-lg p-3 text-sm ${
        severityStyles[risk.severity] || 'border-gray-300 bg-muted/30'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start justify-between w-full text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                risk.severity === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : risk.severity === 'high'
                  ? 'bg-orange-100 text-orange-700'
                  : risk.severity === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {severityLabels[risk.severity]}
            </span>
            <span className="font-medium truncate">{risk.category}</span>
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-2">
            {risk.description}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-2">
          {risk.affectedFiles && risk.affectedFiles.length > 0 && (
            <div>
              <span className="text-xs font-medium">影响文件:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {risk.affectedFiles.map((file, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 bg-background rounded border"
                  >
                    {file.split('/').pop()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {risk.recommendation && (
            <div>
              <span className="text-xs font-medium">建议:</span>
              <p className="text-muted-foreground mt-0.5">{risk.recommendation}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <ConfidenceBadge score={risk.confidenceScore} label={risk.confidence} />
          </div>
        </div>
      )}
    </div>
  );
}

// Comments Section
function CommentsSection({
  comments,
  selectedFile,
}: {
  comments: ReviewComment[];
  selectedFile: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!comments || comments.length === 0) {
    return (
      <div className="px-4 py-2">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          无 Review Comments
        </div>
      </div>
    );
  }

  // Filter by selected file if any
  const filteredComments = selectedFile
    ? comments.filter((c) => c.file === selectedFile)
    : comments;

  const handleCopyComments = () => {
    const text = filteredComments
      .map(
        (c) =>
          `**${c.file}${c.line ? `:${c.line}` : ''}**\n${c.comment}${
            c.suggestion ? `\n\n建议: ${c.suggestion}` : ''
          }`
      )
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left font-medium"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <MessageSquare className="h-4 w-4 text-blue-500" />
        Comments
        <span className="text-xs font-normal text-muted-foreground ml-1">
          ({filteredComments.length})
        </span>
        {selectedFile && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            (已筛选)
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <button
            onClick={handleCopyComments}
            className="flex items-center gap-1.5 text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                复制为 PR 评论
              </>
            )}
          </button>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredComments.slice(0, 5).map((comment, index) => (
              <div
                key={index}
                className="text-sm p-2 rounded bg-muted/50 border"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">
                    {comment.file.split('/').pop()}
                  </span>
                  {comment.line && <span>行 {comment.line}</span>}
                </div>
                <p className="line-clamp-3">{comment.comment}</p>
              </div>
            ))}
            {filteredComments.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                还有 {filteredComments.length - 5} 条评论...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Meta Section
function MetaSection({ meta }: { meta: ReviewResult['meta'] | undefined }) {
  const [expanded, setExpanded] = useState(false);

  if (!meta) return null;

  return (
    <div className="px-4 pt-2 border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Info className="h-4 w-4" />
        Meta 信息
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" />
            <span>Provider: {meta.provider}</span>
            {meta.models?.summary && (
              <span className="text-foreground">({meta.models.summary})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>耗时: {((meta.latencyMs?.total ?? 0) / 1000).toFixed(1)}s</span>
          </div>

          {meta.usage && (
            <div className="flex items-center gap-2">
              <span>Tokens: {meta.usage.totalTokens.toLocaleString()}</span>
              {meta.usage.estimatedCostUsd && (
                <span>(${meta.usage.estimatedCostUsd.toFixed(4)})</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span>可靠性评分:</span>
            <span
              className={`font-medium ${
                meta.reliabilityScore >= 0.8
                  ? 'text-green-600'
                  : meta.reliabilityScore >= 0.6
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {(meta.reliabilityScore * 100).toFixed(0)}%
            </span>
          </div>

          {meta.attempts &&
            (meta.attempts.summary > 1 ||
              meta.attempts.risk > 1 ||
              meta.attempts.comments > 1) && (
            <div>
              重试次数: summary {meta.attempts.summary}, risk {meta.attempts.risk}, comments{' '}
              {meta.attempts.comments}
            </div>
          )}

          {meta.groundingWarnings && meta.groundingWarnings.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Grounding Warnings:</span>
              </div>
              <ul className="mt-1 space-y-0.5 pl-4">
                {meta.groundingWarnings.map((w, i) => (
                  <li key={i} className="text-amber-600/80">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {meta.provider === 'mock' && (
            <div className="flex items-center gap-1 text-amber-600 pt-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>演示模式：使用 Mock 数据，非真实分析结果</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ score, label }: { score?: number; label?: string }) {
  const display = formatConfidencePercent(score, label);
  const numeric = score ?? (label === 'high' ? 0.9 : label === 'medium' ? 0.7 : label === 'low' ? 0.5 : 0);

  let color = 'bg-gray-100 text-gray-700';
  if (numeric >= 0.9) color = 'bg-green-100 text-green-700';
  else if (numeric >= 0.7) color = 'bg-blue-100 text-blue-700';
  else if (numeric >= 0.5) color = 'bg-yellow-100 text-yellow-700';
  else color = 'bg-red-100 text-red-700';

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{display}</span>
  );
}
