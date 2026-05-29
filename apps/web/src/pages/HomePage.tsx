import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitPullRequest, Loader2, ArrowRight } from 'lucide-react';
import { createReview, isValidPrUrl } from '@/api/review-client';
import { useToast } from '@/components/ui/Toaster';
import type { ReviewStatus } from '@/types';

interface HomePageProps {
  onReviewStart: (review: ReviewStatus) => void;
}

export function HomePage({ onReviewStart }: HomePageProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast('请输入 GitHub PR URL', 'error');
      return;
    }

    if (!isValidPrUrl(url)) {
      toast('请输入有效的 GitHub PR URL (格式: https://github.com/owner/repo/pull/123)', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await createReview({
        prUrl: url.trim(),
        async: true,
      });

      const reviewStatus: ReviewStatus = {
        ok: true,
        reviewId: response.reviewId,
        status: response.status,
        progress: response.progress,
        result: response.result,
      };

      onReviewStart(reviewStatus);
      navigate(`/review/${response.reviewId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建审查任务失败';
      toast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GitPullRequest className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            AI 代码审查助手
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            输入 GitHub PR 链接，自动获取变更、识别风险、生成审查建议
          </p>
        </div>

        {/* Input Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              disabled={isLoading}
              className="w-full px-4 py-4 pr-36 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-base"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">分析中</span>
                </>
              ) : (
                <>
                  <span>开始分析</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            支持公开仓库和已授权的私有仓库 · 需要配置 GITHUB_TOKEN
          </p>
        </form>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          <FeatureCard
            title="智能分析"
            description="多 Agent 协作：Summary、Risk、Review Comments 并行处理"
          />
          <FeatureCard
            title="风险识别"
            description="识别 auth、数据库、缓存、并发等工程风险"
          />
          <FeatureCard
            title="行级定位"
            description="评论精确映射到 diff 行号，支持 GitHub Review 格式"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card/50 text-center">
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
