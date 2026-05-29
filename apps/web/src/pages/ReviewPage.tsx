import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getReview, subscribeToEvents } from '@/api/review-client';
import { FileTree } from '@/components/file-tree/FileTree';
import { DiffViewer } from '@/components/diff-viewer/DiffViewer';
import { ReviewPanel } from '@/components/review-panel/ReviewPanel';
import { ProgressBar } from '@/components/progress-bar/ProgressBar';
import type { ReviewStatus, FileTreeItem, ReviewJobArtifacts, ReviewResult } from '@/types';
import { mapFileStatus } from '@/types';

interface ReviewPageProps {
  initialReview: ReviewStatus | null;
}

export function ReviewPage({ initialReview }: ReviewPageProps) {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  const [review, setReview] = useState<ReviewStatus | null>(initialReview);
  const [loading, setLoading] = useState(!initialReview);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileTreeItems: FileTreeItem[] =
    review?.result && review.artifacts
      ? buildFileTreeFromResult(review.result, review.artifacts)
      : [];

  useEffect(() => {
    if (!reviewId) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cleanupSse: (() => void) | null = null;
    let cancelled = false;

    const fetchReview = async () => {
      try {
        const data = await getReview(reviewId);
        if (cancelled) return;
        setReview(data);
        setLoading(false);

        if (data.status === 'completed' || data.status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          if (cleanupSse) {
            cleanupSse();
            cleanupSse = null;
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取审查状态失败');
        setLoading(false);
      }
    };

    void fetchReview();

    pollInterval = setInterval(() => {
      void fetchReview();
    }, 2000);

    try {
      cleanupSse = subscribeToEvents(
        reviewId,
        (event) => {
          if (event.progress) {
            setReview((prev) =>
              prev
                ? {
                    ...prev,
                    progress: {
                      ...prev.progress,
                      percent: event.progress!.percent,
                    },
                  }
                : null,
            );
          }
        },
        () => undefined,
      );
    } catch {
      // SSE optional
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (cleanupSse) cleanupSse();
    };
  }, [reviewId]);

  useEffect(() => {
    if (review?.result && fileTreeItems.length > 0 && !selectedFile) {
      setSelectedFile(fileTreeItems[0].filename);
    }
  }, [review?.result, fileTreeItems, selectedFile]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载审查结果...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">加载失败</h2>
          <p className="text-muted-foreground">{error || '审查任务不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (review.status === 'queued' || review.status === 'running') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <ProgressBar percent={review.progress.percent} status={review.status} />
          <p className="text-center text-muted-foreground text-sm">正在分析 PR，请稍候...</p>
        </div>
      </div>
    );
  }

  if (review.status === 'failed') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">分析失败</h2>
          <p className="text-muted-foreground">{review.error || '未知错误'}</p>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isMock =
    review.result?.meta?.provider === 'mock' ||
    review.artifacts?.resolvedProvider === 'mock';
  const mockWarning = review.warnings?.some((w) => w.toLowerCase().includes('mock'));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 border-b bg-card/50 flex items-center px-4 shrink-0 gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <div className="flex-1 truncate text-sm">
          {review.result?.summary.title || 'PR Review'}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {review.cached && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">来自缓存</span>
          )}
          {isMock && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">演示数据</span>
          )}
        </div>
      </div>

      {(mockWarning || isMock) && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
          当前为 Mock 演示数据。请确认 `.env` 中已配置 `DEEPSEEK_API_KEY` 并重启 server。
        </div>
      )}

      {review.cached && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
          此结果来自内存缓存。如需重新分析，请返回首页再次提交（已默认 skipCache）。
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r bg-card/30 overflow-y-auto shrink-0 hidden md:block">
          <FileTree
            files={fileTreeItems}
            selectedFile={selectedFile}
            onSelect={setSelectedFile}
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <DiffViewer
            filename={selectedFile}
            result={review.result}
            artifacts={review.artifacts}
          />
        </div>

        <div className="w-96 border-l bg-card/30 overflow-y-auto shrink-0 hidden lg:block">
          <ReviewPanel result={review.result} selectedFile={selectedFile} />
        </div>
      </div>
    </div>
  );
}

function buildFileTreeFromResult(
  result: ReviewResult,
  artifacts: ReviewJobArtifacts,
): FileTreeItem[] {
  const files = new Map<string, FileTreeItem>();
  const relevanceByFile = new Map(
    artifacts.fileRelevance.map((entry) => [entry.file, entry]),
  );

  for (const changed of artifacts.changedFiles) {
    const relevance = relevanceByFile.get(changed.filename);
    files.set(changed.filename, {
      filename: changed.filename,
      status: mapFileStatus(changed.status),
      commentCount: 0,
      relevanceScore: relevance?.relevanceScore,
      riskLevel: mapPriorityToRisk(relevance?.priority),
    });
  }

  for (const comment of result.comments?.comments ?? []) {
    const existing = files.get(comment.file);
    if (existing) {
      existing.commentCount += 1;
      if (isHigherSeverity(comment.severity, existing.riskLevel)) {
        existing.riskLevel = normalizeSeverity(comment.severity);
      }
    } else {
      files.set(comment.file, {
        filename: comment.file,
        status: 'modified',
        commentCount: 1,
        riskLevel: normalizeSeverity(comment.severity),
      });
    }
  }

  for (const risk of result.risks?.risks ?? []) {
    for (const file of risk.affectedFiles ?? []) {
      const existing = files.get(file);
      if (existing) {
        if (isHigherSeverity(risk.severity, existing.riskLevel)) {
          existing.riskLevel = risk.severity;
        }
      } else {
        files.set(file, {
          filename: file,
          status: 'modified',
          commentCount: 0,
          riskLevel: risk.severity,
        });
      }
    }
  }

  return Array.from(files.values()).sort((a, b) => {
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, undefined: 4 };
    const aOrder = riskOrder[a.riskLevel ?? 'undefined'];
    const bOrder = riskOrder[b.riskLevel ?? 'undefined'];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
  });
}

function mapPriorityToRisk(
  priority?: string,
): FileTreeItem['riskLevel'] | undefined {
  if (priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority;
  }
  return undefined;
}

function normalizeSeverity(
  severity: string,
): FileTreeItem['riskLevel'] | undefined {
  if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') {
    return severity;
  }
  return undefined;
}

function isHigherSeverity(
  next: string,
  current: FileTreeItem['riskLevel'] | undefined,
): boolean {
  const order = { critical: 0, high: 1, medium: 2, low: 3, undefined: 4, suggestion: 5 };
  const nextLevel = normalizeSeverity(next) ?? 'undefined';
  const currentLevel = current ?? 'undefined';
  return order[nextLevel] < order[currentLevel];
}
