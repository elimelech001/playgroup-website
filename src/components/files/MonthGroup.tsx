import { useState } from 'react';
import { ChevronRight, FileText, Table2, Image, File, ExternalLink } from 'lucide-react';
import * as fileSystem from '@/lib/fileSystem';
import type { FileEntry } from '@/lib/fileSystem';

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
  const [openError, setOpenError] = useState<string | null>(null);

  async function handleOpen(entry: FileEntry) {
    setOpenError(null);
    try {
      await fileSystem.openFile(entry.handle);
    } catch (err) {
      if (err instanceof fileSystem.FileSystemError) {
        setOpenError('Could not open file. Try reconnecting your folder.');
      } else {
        setOpenError('An unexpected error occurred.');
      }
    }
  }

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
                aria-label={`Open ${entry.name}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 cursor-pointer group transition-colors"
                onClick={() => handleOpen(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleOpen(entry); }
                }}
              >
                {getFileIcon(entry.name)}
                <span className="flex-1 text-sm text-stone-800 truncate" title={entry.name}>
                  {entry.name}
                </span>
                <span className="text-xs text-stone-400 shrink-0 tabular-nums mr-2">
                  {entry.lastModified.toLocaleDateString()}
                </span>
                <ExternalLink
                  className="w-4 h-4 text-stone-300 group-hover:text-teal-600 transition-colors shrink-0"
                  aria-hidden="true"
                />
              </li>
            ))
          )}
        </ul>
      )}

      {openError && (
        <p className="text-rose-600 text-sm px-4 py-2" role="alert">
          {openError}
        </p>
      )}
    </div>
  );
}
