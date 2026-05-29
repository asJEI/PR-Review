import { FileText, Plus, Minus, RefreshCw, AlertCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import type { FileTreeItem } from '@/types';

interface FileTreeProps {
  files: FileTreeItem[];
  selectedFile: string | null;
  onSelect: (filename: string) => void;
}

const statusIcons = {
  added: <Plus className="h-3.5 w-3.5 text-green-500" />,
  modified: <RefreshCw className="h-3.5 w-3.5 text-amber-500" />,
  removed: <Minus className="h-3.5 w-3.5 text-red-500" />,
  renamed: <RefreshCw className="h-3.5 w-3.5 text-blue-500" />,
};

const riskBadgeStyles = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const riskIcons = {
  critical: <AlertCircle className="h-3 w-3 text-red-500" />,
  high: <AlertTriangle className="h-3 w-3 text-orange-500" />,
  medium: null,
  low: null,
};

export function FileTree({ files, selectedFile, onSelect }: FileTreeProps) {
  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        暂无文件数据
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        变更文件 ({files.length})
      </div>
      <div className="space-y-0.5">
        {files.map((file) => (
          <FileTreeItemRow
            key={file.filename}
            file={file}
            isSelected={selectedFile === file.filename}
            onSelect={() => onSelect(file.filename)}
          />
        ))}
      </div>
    </div>
  );
}

interface FileTreeItemRowProps {
  file: FileTreeItem;
  isSelected: boolean;
  onSelect: () => void;
}

function FileTreeItemRow({ file, isSelected, onSelect }: FileTreeItemRowProps) {
  const filename = file.filename.split('/').pop() || file.filename;
  const dirname = file.filename.split('/').slice(0, -1).join('/');

  return (
    <button
      onClick={onSelect}
      className={`w-full px-3 py-2 flex items-start gap-2 text-left text-sm hover:bg-accent transition-colors ${
        isSelected ? 'bg-accent border-l-2 border-primary' : 'border-l-2 border-transparent'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {statusIcons[file.status] || <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate font-medium" title={file.filename}>
          {filename}
        </div>
        {dirname && (
          <div className="truncate text-xs text-muted-foreground" title={dirname}>
            {dirname}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {file.riskLevel && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                riskBadgeStyles[file.riskLevel]
              }`}
            >
              {riskIcons[file.riskLevel]}
              {file.riskLevel === 'critical'
                ? '严重'
                : file.riskLevel === 'high'
                ? '高'
                : file.riskLevel === 'medium'
                ? '中'
                : '低'}
            </span>
          )}

          {file.commentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
              <MessageSquare className="h-3 w-3" />
              {file.commentCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
