import { ExternalLink, Loader2, PlayCircle } from 'lucide-react';
import type { DemoPresetMeta } from '@/data/demo-presets';

const TAG_COLOR_STYLES: Record<DemoPresetMeta['tagColor'], string> = {
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
};

interface DemoPresetCardProps {
  preset: DemoPresetMeta;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (presetId: string) => void;
}

export function DemoPresetCard({
  preset,
  loading = false,
  disabled = false,
  onSelect,
}: DemoPresetCardProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      disabled={isDisabled}
      className="group text-left p-4 rounded-lg border bg-card/50 hover:bg-card hover:border-primary/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TAG_COLOR_STYLES[preset.tagColor]}`}
            >
              {preset.category}
            </span>
            <span className="text-[10px] text-muted-foreground">#{preset.id}</span>
          </div>

          <h3 className="font-medium text-sm leading-snug line-clamp-2">{preset.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>

          <a
            href={preset.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            查看 PR
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="shrink-0 pt-1">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>
    </button>
  );
}
