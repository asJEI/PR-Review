import { useState, useCallback } from 'react';
import { createReview, getReview, type CreateReviewRequest } from '@/api/review-client';
import type { ReviewStatus, ReviewProgress } from '@/types';

interface UseReviewState {
  review: ReviewStatus | null;
  loading: boolean;
  error: string | null;
}

interface UseReviewReturn extends UseReviewState {
  startReview: (request: CreateReviewRequest) => Promise<ReviewStatus | null>;
  refreshReview: (reviewId: string) => Promise<void>;
  updateProgress: (progress: ReviewProgress) => void;
}

export function useReview(): UseReviewReturn {
  const [state, setState] = useState<UseReviewState>({
    review: null,
    loading: false,
    error: null,
  });

  const startReview = useCallback(async (
    request: CreateReviewRequest
  ): Promise<ReviewStatus | null> => {
    setState({ review: null, loading: true, error: null });

    try {
      const response = await createReview(request);

      const reviewStatus: ReviewStatus = {
        ok: true,
        reviewId: response.reviewId,
        status: response.status,
        progress: response.progress,
        result: response.result,
      };

      setState({
        review: reviewStatus,
        loading: false,
        error: null,
      });

      return reviewStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建审查任务失败';
      setState({
        review: null,
        loading: false,
        error: message,
      });
      return null;
    }
  }, []);

  const refreshReview = useCallback(async (reviewId: string): Promise<void> => {
    try {
      const data = await getReview(reviewId);
      setState({
        review: data,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取审查状态失败';
      setState((prev) => ({
        ...prev,
        error: message,
        loading: false,
      }));
    }
  }, []);

  const updateProgress = useCallback((progress: ReviewProgress) => {
    setState((prev) =>
      prev.review
        ? {
            ...prev,
            review: {
              ...prev.review,
              progress,
            },
          }
        : prev
    );
  }, []);

  return {
    ...state,
    startReview,
    refreshReview,
    updateProgress,
  };
}
