import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore, useActiveChildren } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChildCard } from './ChildCard';
import { EnrollmentFilter } from './EnrollmentFilter';
import { ChildProfileDialog } from './ChildProfileDialog';
import type { Child } from '@/types';

interface ChildCardGridProps {
  onSelectChild: (child: Child) => void;
}

export function ChildCardGrid({ onSelectChild }: ChildCardGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const allActiveChildren = useActiveChildren();
  const searchTerm = useStore((s) => s.searchTerm);
  const setSearchTerm = useStore((s) => s.setSearchTerm);
  const enrollmentFilters = useStore((s) => s.enrollmentFilters);
  const setEnrollmentFilters = useStore((s) => s.setEnrollmentFilters);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredChildren = useMemo(
    () =>
      allActiveChildren.filter((c) => {
        const nameMatch =
          searchTerm.trim() === '' ||
          c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch =
          enrollmentFilters.length === 0 ||
          enrollmentFilters.includes(c.enrollmentStatus);
        return nameMatch && statusMatch;
      }),
    [allActiveChildren, searchTerm, enrollmentFilters]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search children..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchTerm('');
            }}
            className="pr-8"
            aria-label="Search children by name"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              ×
            </button>
          )}
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-teal-700 text-white hover:bg-teal-800 shrink-0"
        >
          Add Child
        </Button>
      </div>

      {/* Enrollment status filter pills */}
      <EnrollmentFilter
        selected={enrollmentFilters}
        onChange={setEnrollmentFilters}
      />

      {/* Result count */}
      <p className="text-stone-500 text-sm" aria-live="polite" aria-atomic="true">
        {filteredChildren.length} of {allActiveChildren.length}
      </p>

      {/* Content */}
      {allActiveChildren.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-stone-500">No children added yet.</p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            Add your first child
          </Button>
        </div>
      ) : filteredChildren.length === 0 ? (
        <p className="text-stone-500 py-8 text-center">
          No children match the current filters.
        </p>
      ) : (
        <div
          role="list"
          className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
        >
          {filteredChildren.map((child) => (
            <ChildCard key={child.id} child={child} onSelect={onSelectChild} />
          ))}
        </div>
      )}

      <ChildProfileDialog
        mode="add"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
