import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { checkHealth } from '@/api/review-client';
import { HomePage } from '@/pages/HomePage';
import { ReviewPage } from '@/pages/ReviewPage';
import { Header } from '@/components/ui/Header';
import { Toaster } from '@/components/ui/Toaster';
import type { ReviewStatus } from '@/types';

function App() {
  const [healthStatus, setHealthStatus] = useState<{
    ok: boolean;
    checked: boolean;
  }>({ ok: false, checked: false });
  const [currentReview, setCurrentReview] = useState<ReviewStatus | null>(null);

  useEffect(() => {
    checkHealth()
      .then((result) => {
        setHealthStatus({ ok: result.ok, checked: true });
      })
      .catch(() => {
        setHealthStatus({ ok: false, checked: true });
      });
  }, []);

  return (
    <Toaster>
      <div className="min-h-screen bg-background flex flex-col">
        <Header healthStatus={healthStatus} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {!healthStatus.checked ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-muted-foreground">检查服务状态...</div>
            </div>
          ) : !healthStatus.ok ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-destructive text-lg font-medium">
                  无法连接到后端服务
                </div>
                <p className="text-muted-foreground text-sm">
                  请确保后端服务已启动：
                  <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
                    pnpm run start:server
                  </code>
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    onReviewStart={setCurrentReview}
                  />
                }
              />
              <Route
                path="/review/:reviewId"
                element={
                  <ReviewPage
                    initialReview={currentReview}
                  />
                }
              />
            </Routes>
          )}
        </main>
      </div>
    </Toaster>
  );
}

export default App;
