import { useState } from 'react';
import { ChevronRight, FileText, Table2, Image, File } from 'lucide-react';
import type { FileEntry } from '@/lib/fileSystem';
import { FilePreviewModal } from './FilePreviewModal';

interface MonthGroupProps {
  label: string;
  files: FileEntry[];
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
      return <FileText className="w-4 h-4 shrink-0 text-stone-400" aria-hidden="true" />;
    case 'xls':
    case 'xlsx':
      return <Table2 className="w-4 h-4 shrink-0 text-stone-400" aria-hidden="true" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <Image className="w-4 h-4 shrink-0 text-stone-400" aria-hidden="true" />;
    default:
      return <File className="w-4 h-4 shrink-0 text-stone-400" aria-hidden="true" />;
  }
}

export function MonthGroup({ label, files, defaultExpanded = true, onToggle }: MonthGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null);

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => { const next = !v; onToggle?.(next); return next; })}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 text-left transition-colors"
        aria-expanded={expanded}
      >
        <ChevronRight
          className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
        <span className="font-medium text-stone-700 text-sm">{label}</span>
        <span className="ml-auto text-xs text-stone-400">{files.length}</span>
      </button>

      {expanded && (
        <ul className="divide-y divide-stone-100">
          {files.length === 0 ? (
            <li className="px-4 py-3 text-stone-500 text-sm">
              No newsletters found for {label}.
            </li>
          ) : (
            files.map((entry) => (
              <li
                key={entry.name}
                role="button"
                tabIndex={0}
                aria-label={`Preview ${entry.name}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 cursor-pointer group transition-colors"
                onClick={() => setPreviewEntry(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); setPreviewEntry(entry); }
                }}
              >
                {getFileIcon(entry.name)}
                <span className="flex-1 text-sm text-stone-800 truncate" title={entry.name}>
                  {entry.name}
                </span>
                <span className="text-xs text-stone-400 shrink-0 tabular-nums">
                  {entry.lastModified.toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {previewEntry && (
        <FilePreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      )}
    </div>
  );
}
