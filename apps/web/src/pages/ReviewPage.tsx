import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getReview, subscribeToEvents } from '@/api/review-client';
import { FileTree } from '@/components/file-tree/FileTree';
import { DiffViewer } from '@/components/diff-viewer/DiffViewer';
import { ReviewPanel } from '@/components/review-panel/ReviewPanel';
import { ProgressBar } from '@/components/progress-bar/ProgressBar';
import { useToast } from '@/components/ui/Toaster';
import type { ReviewStatus, FileTreeItem } from '@/types';

interface ReviewPageProps {
  initialReview: ReviewStatus | null;
}

export function ReviewPage({ initialReview }: ReviewPageProps) {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [review, setReview] = useState<ReviewStatus | null>(initialReview);
  const [loading, setLoading] = useState(!initialReview);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Build file tree from review result
  const fileTreeItems: FileTreeItem[] = review?.result
    ? buildFileTreeFromResult(review.result)
    : [];

  // Poll or subscribe to updates
  useEffect(() => {
    if (!reviewId) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let cleanupSse: (() => void) | null = null;

    const fetchReview = async () => {
      try {
        const data = await getReview(reviewId);
        setReview(data);
        setLoading(false);

        // If completed or failed, stop polling
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
        setError(err instanceof Error ? err.message : '获取审查状态失败');
        setLoading(false);
      }
    };

    // Initial fetch
    if (!review) {
      fetchReview();
    }

    // Start polling if still running
    if (review?.status === 'running' || review?.status === 'queued') {
      pollInterval = setInterval(fetchReview, 2000);

      // Try SSE
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
                  : null
              );
            }
          },
          () => {
            // SSE error, ignore and rely on polling
          }
        );
        setUnsubscribe(() => cleanupSse);
      } catch {
        // SSE not supported or failed, polling is enough
      }
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (cleanupSse) cleanupSse();
    };
  }, [reviewId, review]);

  // Auto-select first file when result arrives
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

  // Show progress if still running
  if (review.status === 'queued' || review.status === 'running') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <ProgressBar
            percent={review.progress.percent}
            status={review.status}
          />
          <p className="text-center text-muted-foreground text-sm">
            正在分析 PR，请稍候...
          </p>
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

  // Completed - show three-column layout
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
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
        <div className="text-xs text-muted-foreground">
          {review.result?.meta.provider === 'mock' && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
              演示数据
            </span>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree */}
        <div className="w-64 border-r bg-card/30 overflow-y-auto shrink-0 hidden md:block">
          <FileTree
            files={fileTreeItems}
            selectedFile={selectedFile}
            onSelect={setSelectedFile}
          />
        </div>

        {/* Middle: Diff Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <DiffViewer
            filename={selectedFile}
            result={review.result}
          />
        </div>

        {/* Right: Review Panel */}
        <div className="w-96 border-l bg-card/30 overflow-y-auto shrink-0 hidden lg:block">
          <ReviewPanel result={review.result} selectedFile={selectedFile} />
        </div>
      </div>
    </div>
  );
}

function buildFileTreeFromResult(result: ReviewStatus['result']): FileTreeItem[] {
  if (!result) return [];

  // Get files from various sources
  const files = new Map<string, FileTreeItem>();

  // From processed files in meta
  result.meta.processedFiles?.forEach((filename) => {
    files.set(filename, {
      filename,
      status: 'modified',
      commentCount: 0,
    });
  });

  // From affected systems in summary
  result.summary?.affectedSystems?.forEach((system) => {
    // Try to extract file paths from system names
    if (!files.has(system)) {
      files.set(system, {
        filename: system,
        status: 'modified',
        commentCount: 0,
      });
    }
  });

  // From comments
  result.comments?.comments?.forEach((comment) => {
    const existing = files.get(comment.file);
    if (existing) {
      existing.commentCount++;
      // Update risk level based on severity
      if (comment.severity === 'critical' || comment.severity === 'high') {
        existing.riskLevel = comment.severity;
      } else if (!existing.riskLevel && comment.severity) {
        existing.riskLevel = comment.severity;
      }
    } else {
      files.set(comment.file, {
        filename: comment.file,
        status: 'modified',
        commentCount: 1,
        riskLevel: comment.severity,
      });
    }
  });

  // From risks
  result.risks?.risks?.forEach((risk) => {
    risk.affectedFiles?.forEach((file) => {
      const existing = files.get(file);
      if (existing) {
        if (risk.severity === 'critical' || risk.severity === 'high') {
          existing.riskLevel = risk.severity;
        } else if (!existing.riskLevel) {
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
    });
  });

  return Array.from(files.values()).sort((a, b) => {
    // Sort by risk level (critical > high > medium > low)
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, undefined: 4 };
    const aOrder = riskOrder[a.riskLevel ?? 'undefined'];
    const bOrder = riskOrder[b.riskLevel ?? 'undefined'];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.commentCount - a.commentCount;
  });
}
