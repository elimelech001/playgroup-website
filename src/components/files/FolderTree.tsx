import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import type { FolderNode, FileEntry } from '@/lib/fileSystem';
import { MonthGroup } from './MonthGroup';

type MonthGroupComponent = typeof MonthGroup;

type MonthGroupData = { key: string; label: string; files: FileEntry[] };

interface FolderTreeProps {
  node: FolderNode;
  depth: number;
  expandedGroups: Record<string, boolean>;
  onGroupToggle: (key: string, expanded: boolean) => void;
  groupByMonth: (entries: FileEntry[]) => MonthGroupData[];
  MonthGroupComponent: MonthGroupComponent;
}

export function FolderTree({
  node,
  depth,
  expandedGroups,
  onGroupToggle,
  groupByMonth,
  MonthGroupComponent,
}: FolderTreeProps) {
  // Root node (depth 0) is always expanded and has no toggle header
  const [expanded, setExpanded] = useState(true);

  const isEmpty = node.files.length === 0 && node.subfolders.length === 0;

  if (isEmpty && depth === 0) {
    return <p className="text-stone-500 text-sm py-8">No files found in this folder.</p>;
  }

  const monthGroups = groupByMonth(node.files);
  const indent = depth > 0 ? `pl-${Math.min(depth * 4, 12)}` : '';

  return (
    <div className={depth > 0 ? `mt-1 ${indent}` : 'space-y-2'}>
      {/* Folder header — only shown for sub-folders (depth > 0) */}
      {depth > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-left transition-colors border border-stone-200"
          aria-expanded={expanded}
        >
          <ChevronRight
            className={`w-4 h-4 text-stone-500 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          <Folder className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
          <span className="font-medium text-stone-700 text-sm truncate">{node.name}</span>
          <span className="ml-auto text-xs text-stone-400 shrink-0">
            {node.files.length + node.subfolders.length}
          </span>
        </button>
      )}

      {expanded && (
        <div className={depth > 0 ? 'mt-1 space-y-1 border-l-2 border-stone-200 ml-3 pl-3' : 'space-y-2'}>
          {/* Files in this folder, grouped by month */}
          {monthGroups.map((group, idx) => {
            const stateKey = `${node.name}:${group.key}`;
            return (
              <MonthGroupComponent
                key={stateKey}
                label={group.label}
                files={group.files}
                defaultExpanded={expandedGroups[stateKey] ?? (depth === 0 && idx === 0)}
                onToggle={(exp) => onGroupToggle(stateKey, exp)}
              />
            );
          })}

          {/* Sub-folders, rendered recursively */}
          {node.subfolders.map((sub) => (
            <FolderTree
              key={sub.name}
              node={sub}
              depth={depth + 1}
              expandedGroups={expandedGroups}
              onGroupToggle={onGroupToggle}
              groupByMonth={groupByMonth}
              MonthGroupComponent={MonthGroupComponent}
            />
          ))}

          {node.files.length === 0 && node.subfolders.length === 0 && depth > 0 && (
            <p className="text-xs text-stone-400 py-1 pl-1">Empty folder</p>
          )}
        </div>
      )}
    </div>
  );
}
