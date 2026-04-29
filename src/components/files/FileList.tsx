import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { FolderPrompt } from '@/components/shared/FolderPrompt';
import { MonthGroup } from './MonthGroup';
import { FolderTree } from './FolderTree';
import { FilePreviewModal } from './FilePreviewModal';
import * as fileSystem from '@/lib/fileSystem';
import type { FileEntry, FolderNode } from '@/lib/fileSystem';
import { useStore } from '@/store';

type MonthGroupData = { key: string; label: string; files: FileEntry[] };

const EXPANDED_STATE_KEY = 'gan:newsletterExpandedGroups';

function loadExpandedState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExpandedState(state: Record<string, boolean>) {
  localStorage.setItem(EXPANDED_STATE_KEY, JSON.stringify(state));
}

/** Recursively collect every FileEntry from the tree along with its folder path. */
function flattenTree(node: FolderNode, path: string[] = []): { entry: FileEntry; path: string[] }[] {
  const results: { entry: FileEntry; path: string[] }[] = [];
  for (const file of node.files) {
    results.push({ entry: file, path });
  }
  for (const sub of node.subfolders) {
    results.push(...flattenTree(sub, [...path, sub.name]));
  }
  return results;
}

function groupByMonth(entries: FileEntry[]): MonthGroupData[] {
  const map = new Map<string, { label: string; files: FileEntry[] }>();
  for (const entry of entries) {
    const date = entry.lastModified;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, { label, files: [] });
    map.get(key)!.files.push(entry);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, { label, files }]) => ({ key, label, files }));
}

/** Highlight the matching substring inside a file name. */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-teal-100 text-teal-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function FileList() {
  const hasFolderHandle = useStore((s) => s.hasFolderHandle);
  const setHasFolderHandle = useStore((s) => s.setHasFolderHandle);
  const [isRelink, setIsRelink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(loadExpandedState);

  const handleGroupToggle = useCallback((key: string, expanded: boolean) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [key]: expanded };
      saveExpandedState(next);
      return next;
    });
  }, []);

  async function loadFolder(handle: FileSystemDirectoryHandle) {
    setIsLoading(true);
    try {
      const root = await fileSystem.scanFolder(handle);
      setTree(root);
      setHasFolderHandle(true);
      setIsRelink(false);
    } catch {
      setHasFolderHandle(false);
      setIsRelink(true);
    } finally {
      setIsLoading(false);
    }
  }

  // On mount: try to restore the saved handle from IndexedDB automatically
  useEffect(() => {
    async function tryRestore() {
      // If already connected in this session, just scan
      const existingHandle = fileSystem.getCurrentHandle();
      if (existingHandle) {
        await loadFolder(existingHandle);
        return;
      }
      // Try restoring from IndexedDB (persisted across page reloads)
      const restored = await fileSystem.restoreFolderHandle();
      if (restored) {
        const handle = fileSystem.getCurrentHandle()!;
        await loadFolder(handle);
      } else {
        setIsLoading(false);
        if (fileSystem.getLastFolderName()) setIsRelink(true);
      }
    }
    tryRestore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChooseFolder() {
    const handle = await fileSystem.getFolderHandle();
    if (handle) {
      await loadFolder(handle);
    }
  }

  const lastFolderName = fileSystem.getLastFolderName();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-stone-500 text-sm">
        <span className="animate-spin w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full" />
        Loading folder...
      </div>
    );
  }

  if (!hasFolderHandle) {
    return (
      <FolderPrompt
        message={
          isRelink
            ? 'Your documents folder needs to be reconnected'
            : lastFolderName
            ? `Re-open your folder to restore access: "${lastFolderName}"`
            : 'Choose a folder to get started'
        }
        buttonLabel={isRelink || lastFolderName ? 'Reconnect Folder' : 'Choose Folder'}
        onAction={handleChooseFolder}
      />
    );
  }

  if (!tree) {
    return <p className="text-stone-500 text-sm py-8">No files found in this folder.</p>;
  }

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  // Flatten all files for search
  const allFiles = flattenTree(tree);
  const totalCount = allFiles.length;

  const searchResults = isSearching
    ? allFiles.filter(({ entry }) =>
        entry.name.toLowerCase().includes(trimmed.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-3">
      {/* Folder header with change option */}
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span className="truncate">{lastFolderName ?? 'Documents folder'}</span>
        <button
          type="button"
          onClick={handleChooseFolder}
          className="shrink-0 ml-2 text-xs text-stone-400 hover:text-teal-700 underline underline-offset-2"
        >
          Change folder
        </button>
      </div>

      {/* Search bar */}
      {totalCount > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            aria-label="Search files"
            className="w-full pl-9 pr-9 h-9 rounded-md border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Search results view */}
      {isSearching ? (
        searchResults.length === 0 ? (
          <p className="text-stone-500 text-sm py-6 text-center">
            No files match "<span className="font-medium">{trimmed}</span>"
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-stone-400 px-1">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
            <ul className="border border-stone-200 rounded-lg divide-y divide-stone-100 bg-white overflow-hidden">
              {searchResults.map(({ entry, path }) => (
                <SearchResultRow
                  key={entry.name + path.join('/')}
                  entry={entry}
                  path={path}
                  query={trimmed}
                />
              ))}
            </ul>
          </div>
        )
      ) : (
        /* Normal folder tree view */
        <FolderTree
          node={tree}
          depth={0}
          expandedGroups={expandedGroups}
          onGroupToggle={handleGroupToggle}
          groupByMonth={groupByMonth}
          MonthGroupComponent={MonthGroup}
        />
      )}
    </div>
  );
}

function SearchResultRow({
  entry,
  path,
  query,
}: {
  entry: FileEntry;
  path: string[];
  query: string;
}) {
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null);

  return (
    <>
      <li
        role="button"
        tabIndex={0}
        aria-label={`Preview ${entry.name}`}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 cursor-pointer group transition-colors"
        onClick={() => setPreviewEntry(entry)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPreviewEntry(entry); } }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800 truncate">
            <HighlightMatch text={entry.name} query={query} />
          </p>
          {path.length > 0 && (
            <p className="text-xs text-stone-400 truncate mt-0.5">
              {path.join(' / ')}
            </p>
          )}
        </div>
        <span className="text-xs text-stone-400 shrink-0 tabular-nums">
          {entry.lastModified.toLocaleDateString()}
        </span>
      </li>
      {previewEntry && (
        <FilePreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      )}
    </>
  );
}
