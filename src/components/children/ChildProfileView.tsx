import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStore } from '@/store';
import { computeAge } from '@/lib/ageUtils';
import { toHebrewDate } from '@/lib/hebrewCalendar';
import { ChildProfileDialog } from './ChildProfileDialog';
import type { Child, EnrollmentStatus } from '@/types';

interface ChildProfileViewProps {
  child: Child;
  onBack: () => void;
  readOnly?: boolean;
}

const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  none: 'No contract',
  contractReceived: 'Contract received',
  contractSigned: 'Contract signed',
  left: 'Left',
};

export function ChildProfileView({ child, onBack, readOnly = false }: ChildProfileViewProps) {
  const updateChild = useStore((s) => s.updateChild);
  const markChildLeft = useStore((s) => s.markChildLeft);
  const latestChild = useStore((s) => s.children.find((c) => c.id === child.id) ?? child);
  const [editOpen, setEditOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  function handleNotesChange(notes: string) {
    updateChild({ ...latestChild, notes: notes || undefined });
  }

  const age = computeAge(latestChild.dateOfBirth);
  let hebrewBirthday = '';
  try {
    hebrewBirthday = toHebrewDate(latestChild.dateOfBirth);
  } catch {
    hebrewBirthday = '';
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-teal-700 hover:text-teal-800 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Profiles
        </button>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              onClick={() => setEditOpen(true)}
              variant="outline"
              className="border-stone-300 text-stone-700"
            >
              Edit Profile
            </Button>
            {latestChild.enrollmentStatus !== 'left' && (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => setLeaveConfirmOpen(true)}
              >
                Mark as Left
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-stone-800">{latestChild.name}</h2>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-stone-500">Date of Birth</dt>
            <dd className="text-stone-800">{latestChild.dateOfBirth}{age ? ` · ${age}` : ''}</dd>
          </div>

          {hebrewBirthday && (
            <div>
              <dt className="text-stone-500">Hebrew Birthday</dt>
              <dd className="text-stone-800" dir="rtl">{hebrewBirthday}</dd>
            </div>
          )}

          <div>
            <dt className="text-stone-500">Gender</dt>
            <dd className="text-stone-800">{latestChild.gender === 'male' ? 'Male' : 'Female'}</dd>
          </div>

          <div>
            <dt className="text-stone-500">Phone</dt>
            <dd className="text-stone-800 tabular-nums">{latestChild.phone}</dd>
          </div>

          {latestChild.fatherPhone && (
            <div>
              <dt className="text-stone-500">Father's Phone</dt>
              <dd className="text-stone-800 tabular-nums">{latestChild.fatherPhone}</dd>
            </div>
          )}

          {latestChild.motherPhone && (
            <div>
              <dt className="text-stone-500">Mother's Phone</dt>
              <dd className="text-stone-800 tabular-nums">{latestChild.motherPhone}</dd>
            </div>
          )}

          {latestChild.address && (
            <div>
              <dt className="text-stone-500">Address</dt>
              <dd className="text-stone-800">{latestChild.address}</dd>
            </div>
          )}

          <div>
            <dt className="text-stone-500">Allergies / Medical Notes</dt>
            <dd className={latestChild.allergies ? 'text-rose-700' : 'text-stone-400'}>
              {latestChild.allergies || 'None'}
            </dd>
          </div>

          <div>
            <dt className="text-stone-500">Nap Schedule</dt>
            <dd className={latestChild.napSchedule ? 'text-stone-800' : 'text-stone-400'}>
              {latestChild.napSchedule || 'None'}
            </dd>
          </div>

          <div>
            <dt className="text-stone-500">Enrollment Status</dt>
            <dd className="text-stone-800">{ENROLLMENT_LABELS[latestChild.enrollmentStatus]}</dd>
          </div>
        </dl>

        <div className="pt-2">
          <p className="text-stone-500 text-sm mb-1">Notes</p>
          {readOnly ? (
            <p className={latestChild.notes ? 'text-stone-800 text-sm whitespace-pre-wrap' : 'text-stone-400 text-sm'}>
              {latestChild.notes || 'None'}
            </p>
          ) : (
            <>
              <label htmlFor="child-notes" className="sr-only">Notes</label>
              <Textarea
                id="child-notes"
                value={latestChild.notes ?? ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes about this child..."
                rows={4}
              />
            </>
          )}
        </div>
      </div>

      <ChildProfileDialog
        mode="edit"
        child={latestChild}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark {latestChild.name} as Left?</DialogTitle>
          </DialogHeader>
          <p className="text-stone-600 text-sm">
            This child will be removed from the active class. Their profile and payment history will remain accessible in the "Left this year" section.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setLeaveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                const todayISO = new Date().toISOString().slice(0, 10);
                markChildLeft(latestChild.id, todayISO);
                setLeaveConfirmOpen(false);
                onBack();
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
