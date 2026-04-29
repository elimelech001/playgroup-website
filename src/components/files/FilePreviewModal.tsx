import { useEffect, useRef, useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import mammoth from 'mammoth';
import * as fileSystem from '@/lib/fileSystem';
import type { FileEntry } from '@/lib/fileSystem';

interface FilePreviewModalProps {
  entry: FileEntry;
  onClose: () => void;
}

function getPreviewType(name: string): 'pdf' | 'image' | 'word' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (['doc', 'docx'].includes(ext)) return 'word';
  return 'other';
}

export function FilePreviewModal({ entry, onClose }: FilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const urlRef = useRef<string | null>(null);

  const previewType = getPreviewType(entry.name);

  useEffect(() => {
    let active = true;
    setLoadError(null);
    setBlobUrl(null);
    setWordHtml(null);

    async function load() {
      try {
        const [{ file, url }, segments] = await Promise.all([
          fileSystem.getFileBlob(entry.handle),
          fileSystem.getFilePath(entry.handle),
        ]);
        if (!active) { URL.revokeObjectURL(url); return; }

        urlRef.current = url;
        setFilePath(segments);

        if (previewType === 'word') {
          const arrayBuffer = await file.arrayBuffer();
          if (!active) { URL.revokeObjectURL(url); return; }
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!active) { URL.revokeObjectURL(url); return; }
          setWordHtml(result.value);
          URL.revokeObjectURL(url);
          urlRef.current = null;
        } else {
          setBlobUrl(url);
        }
      } catch {
        if (active) setLoadError('Could not load the file. Try reconnecting your folder.');
      }
    }

    load();

    return () => {
      active = false;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [entry, previewType]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await fileSystem.downloadFile(entry.handle);
    } finally {
      setDownloading(false);
    }
  }

  // Build the display path: root folder name + relative segments
  const rootFolderName = fileSystem.getLastFolderName() ?? '';
  const displayPath = [rootFolderName, ...filePath].filter(Boolean).join(' / ');

  async function handleCopyPath() {
    try {
      await navigator.clipboard.writeText(displayPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  const isLoading = !loadError && blobUrl === null && wordHtml === null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-stone-200 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">{entry.name}</p>
            {/* Full path row — always shown, copyable */}
            <button
              type="button"
              onClick={handleCopyPath}
              title="Copy path to clipboard"
              className="mt-1 flex items-center gap-1.5 text-xs text-stone-400 hover:text-teal-700 transition-colors group max-w-full"
            >
              <span className="font-mono truncate">{displayPath}</span>
              {copied
                ? <Check className="w-3 h-3 shrink-0 text-teal-600" />
                : <Copy className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              }
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Download file"
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-teal-700 px-2.5 py-1.5 rounded-md hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-stone-100 min-h-0">
          {loadError ? (
            <div className="flex items-center justify-center h-full py-16 text-rose-600 text-sm px-6 text-center">
              {loadError}
            </div>

          ) : isLoading ? (
            <div className="flex items-center justify-center h-full py-16 gap-2 text-stone-400 text-sm">
              <span className="animate-spin w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full" />
              Loading…
            </div>

          ) : previewType === 'pdf' && blobUrl ? (
            <iframe
              src={blobUrl}
              title={entry.name}
              className="w-full h-full border-0"
              style={{ minHeight: '60vh' }}
            />

          ) : previewType === 'image' && blobUrl ? (
            <div className="flex items-center justify-center h-full p-4" style={{ minHeight: '60vh' }}>
              <img
                src={blobUrl}
                alt={entry.name}
                className="max-w-full max-h-full object-contain rounded shadow"
              />
            </div>

          ) : previewType === 'word' && wordHtml ? (
            <div
              className="word-preview bg-white mx-auto my-6 px-10 py-8 rounded shadow min-h-[60vh] max-w-3xl text-stone-800 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />

          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-stone-500 text-sm" style={{ minHeight: '30vh' }}>
              <p>Preview not available for this file type.</p>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-sm text-teal-700 underline underline-offset-2 hover:text-teal-900"
              >
                <Download className="w-4 h-4" />
                Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
