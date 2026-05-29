import { GitPullRequest, Activity } from 'lucide-react';

interface HeaderProps {
  healthStatus: {
    ok: boolean;
    checked: boolean;
  };
}

export function Header({ healthStatus }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <GitPullRequest className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-lg">PR-Review</h1>
        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
          AI 代码审查助手
        </span>
      </div>

      <div className="flex items-center gap-4">
        {healthStatus.checked && (
          <div className="flex items-center gap-1.5 text-xs">
            <Activity
              className={`h-3.5 w-3.5 ${
                healthStatus.ok ? 'text-green-500' : 'text-destructive'
              }`}
            />
            <span
              className={
                healthStatus.ok
                  ? 'text-muted-foreground'
                  : 'text-destructive'
              }
            >
              {healthStatus.ok ? '服务正常' : '服务断开'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
