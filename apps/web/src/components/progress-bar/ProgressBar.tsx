import { REVIEW_PHASES } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  percent: number;
  status?: string;
  phase?: string;
}

export function ProgressBar({ percent, status, phase }: ProgressBarProps) {
  // Map percent to phase
  const currentPhaseIndex = Math.min(
    Math.floor((percent / 100) * REVIEW_PHASES.length),
    REVIEW_PHASES.length - 1
  );

  const currentPhase = REVIEW_PHASES[currentPhaseIndex];

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${Math.max(percent, 5)}%` }}
        />
      </div>

      {/* Current Phase Info */}
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="flex-1">
          <p className="font-medium text-sm">
            {phase || currentPhase?.label || '分析中...'}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentPhase?.description || '正在处理'}
          </p>
        </div>
        <span className="text-sm font-medium">{Math.round(percent)}%</span>
      </div>

      {/* Phase List */}
      <div className="space-y-1.5">
        {REVIEW_PHASES.map((p, index) => {
          const isCompleted = index < currentPhaseIndex;
          const isCurrent = index === currentPhaseIndex;
          const isPending = index > currentPhaseIndex;

          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 text-xs ${
                isCompleted
                  ? 'text-green-600'
                  : isCurrent
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted-foreground/30'
                }`}
              />
              <span className={isCurrent ? 'font-medium' : ''}>
                {p.label}
              </span>
              {isCompleted && (
                <span className="ml-auto text-[10px]">完成</span>
              )}
              {isCurrent && (
                <span className="ml-auto text-[10px]">进行中</span>
              )}
            </div>
          );
        })}
      </div>

      {status && (
        <p className="text-xs text-muted-foreground text-center">
          状态: {status === 'queued' ? '排队中' : '运行中'}
        </p>
      )}
    </div>
  );
}
