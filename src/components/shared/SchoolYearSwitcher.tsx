import { useState } from 'react';
import { useStore, useActiveYear } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HebrewDatePicker } from '@/components/ui/HebrewDatePicker';
import type { SchoolYear } from '@/types';

export function SchoolYearSwitcher() {
  const activeYear = useActiveYear();
  const schoolYears = useStore((s) => s.schoolYears);
  const addSchoolYear = useStore((s) => s.addSchoolYear);
  const setActiveYear = useStore((s) => s.setActiveYear);
  const deleteSchoolYear = useStore((s) => s.deleteSchoolYear);
  const editSchoolYear = useStore((s) => s.editSchoolYear);
  const setViewedYearId = useStore((s) => s.setViewedYearId);

  const [open, setOpen] = useState(false);
  const [newYearDialogOpen, setNewYearDialogOpen] = useState(false);
  const [editDialogTarget, setEditDialogTarget] = useState<SchoolYear | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New year form
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [defaultPayment, setDefaultPayment] = useState('');

  // Edit year form
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editDefaultPayment, setEditDefaultPayment] = useState('');

  function handleCreateYear() {
    if (!name.trim() || !startDate || !endDate) return;
    const parsedAmount = defaultPayment.trim() !== '' ? Number(defaultPayment) : undefined;
    const year: SchoolYear = {
      id: crypto.randomUUID(),
      name: name.trim(),
      startDate,
      endDate,
      isActive: true,
      defaultPaymentAmount: parsedAmount != null && !isNaN(parsedAmount) ? parsedAmount : undefined,
    };
    if (activeYear) setActiveYear(activeYear.id); // deactivate current
    addSchoolYear(year);
    setActiveYear(year.id);
    setViewedYearId(null);
    setNewYearDialogOpen(false);
    setOpen(false);
    setName('');
    setStartDate('');
    setEndDate('');
    setDefaultPayment('');
  }

  function openEditDialog(y: SchoolYear) {
    setEditDialogTarget(y);
    setEditName(y.name);
    setEditStart(y.startDate);
    setEditEnd(y.endDate);
    setEditDefaultPayment(y.defaultPaymentAmount != null ? String(y.defaultPaymentAmount) : '');
  }

  function handleEditSave() {
    if (!editDialogTarget || !editName.trim() || !editStart || !editEnd) return;
    const parsedAmount = editDefaultPayment.trim() !== '' ? Number(editDefaultPayment) : undefined;
    editSchoolYear(editDialogTarget.id, {
      name: editName.trim(),
      startDate: editStart,
      endDate: editEnd,
      defaultPaymentAmount: parsedAmount != null && !isNaN(parsedAmount) ? parsedAmount : undefined,
    });
    setEditDialogTarget(null);
  }

  function handleDelete(id: string) {
    deleteSchoolYear(id);
    setConfirmDeleteId(null);
    // If we just deleted the active year, switch view to first remaining
    if (activeYear?.id === id) setViewedYearId(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-stone-600 hover:text-stone-800 font-medium px-2 py-1 rounded hover:bg-stone-200 transition-colors"
        aria-label="School year switcher"
      >
        {activeYear ? activeYear.name : 'No school year'}
      </button>

      {/* Main list dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>School Years</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 my-2">
            {schoolYears.map((y) => (
              <div
                key={y.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-stone-200"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">{y.name}</p>
                  {y.isActive && (
                    <span className="text-xs text-teal-700 font-medium">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!y.isActive && (
                    <button
                      onClick={() => {
                        setActiveYear(y.id);
                        setViewedYearId(null);
                        setOpen(false);
                      }}
                      className="text-xs text-stone-500 hover:text-teal-700 px-1"
                    >
                      Activate
                    </button>
                  )}
                  {!y.isActive && (
                    <button
                      onClick={() => {
                        setViewedYearId(y.id);
                        setOpen(false);
                      }}
                      className="text-xs text-stone-500 hover:text-teal-700 px-1"
                    >
                      View
                    </button>
                  )}
                  <button
                    onClick={() => openEditDialog(y)}
                    className="text-xs text-stone-500 hover:text-teal-700 px-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(y.id)}
                    className="text-xs text-stone-500 hover:text-rose-600 px-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {schoolYears.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-2">No school years yet.</p>
            )}
          </div>
          <Button
            onClick={() => setNewYearDialogOpen(true)}
            className="w-full bg-teal-700 text-white hover:bg-teal-800"
          >
            New School Year
          </Button>
        </DialogContent>
      </Dialog>

      {/* New year dialog */}
      <Dialog open={newYearDialogOpen} onOpenChange={setNewYearDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New School Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="year-name">Year name <span className="text-rose-600" aria-hidden="true">*</span></Label>
              <Input
                id="year-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. תשפ״ו 2025-2026"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="year-start">Start date <span className="text-rose-600" aria-hidden="true">*</span></Label>
              <HebrewDatePicker id="year-start" value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="year-end">End date <span className="text-rose-600" aria-hidden="true">*</span></Label>
              <HebrewDatePicker id="year-end" value={endDate} onChange={setEndDate} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="year-default-payment">Default monthly payment (₪)</Label>
              <Input
                id="year-default-payment"
                type="number"
                min="0"
                step="1"
                value={defaultPayment}
                onChange={(e) => setDefaultPayment(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setNewYearDialogOpen(false)} className="border-stone-300 text-stone-700">
                Cancel
              </Button>
              <Button
                onClick={handleCreateYear}
                disabled={!name.trim() || !startDate || !endDate}
                className="bg-teal-700 text-white hover:bg-teal-800"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit year dialog */}
      <Dialog open={!!editDialogTarget} onOpenChange={(o) => { if (!o) setEditDialogTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit School Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Year name <span className="text-rose-600" aria-hidden="true">*</span></Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Start date <span className="text-rose-600" aria-hidden="true">*</span></Label>
              <HebrewDatePicker value={editStart} onChange={setEditStart} />
            </div>
            <div className="space-y-1">
              <Label>End date <span className="text-rose-600" aria-hidden="true">*</span></Label>
              <HebrewDatePicker value={editEnd} onChange={setEditEnd} />
            </div>
            <div className="space-y-1">
              <Label>Default monthly payment (₪)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={editDefaultPayment}
                onChange={(e) => setEditDefaultPayment(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditDialogTarget(null)} className="border-stone-300 text-stone-700">
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={!editName.trim() || !editStart || !editEnd}
                className="bg-teal-700 text-white hover:bg-teal-800"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete School Year</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600 mt-2">
            Are you sure? This will permanently remove the school year. Children and payments linked to it will remain in the data file.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="border-stone-300 text-stone-700">
              Cancel
            </Button>
            <Button
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
