import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore, useActiveYear } from '@/store';
import { computeAge } from '@/lib/ageUtils';
import { HebrewDatePicker } from '@/components/ui/HebrewDatePicker';
import type { Child, EnrollmentStatus } from '@/types';

interface ChildProfileDialogProps {
  mode: 'add' | 'edit';
  child?: Child;
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  name: string;
  dateOfBirth: string;
  gender: '' | 'male' | 'female';
  phone: string;
  fatherPhone: string;
  motherPhone: string;
  address: string;
  allergies: string;
  napSchedule: string;
  enrollmentStatus: EnrollmentStatus;
  notes: string;
}

const INITIAL_VALUES: FormValues = {
  name: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  fatherPhone: '',
  motherPhone: '',
  address: '',
  allergies: '',
  napSchedule: '',
  enrollmentStatus: 'none',
  notes: '',
};

function validate(values: FormValues): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
  if (!values.gender) errors.gender = 'Gender is required';
  if (!values.phone.trim()) errors.phone = 'Phone is required';
  return errors;
}

const FIELD_ORDER: (keyof FormValues)[] = [
  'name', 'dateOfBirth', 'gender', 'phone', 'fatherPhone', 'motherPhone', 'address', 'allergies', 'napSchedule', 'enrollmentStatus', 'notes',
];

export function ChildProfileDialog({ mode, child, open, onClose }: ChildProfileDialogProps) {
  const addChild = useStore((s) => s.addChild);
  const updateChild = useStore((s) => s.updateChild);
  const activeYear = useActiveYear();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (open && mode === 'add') {
      setValues(INITIAL_VALUES);
      setTouched({});
      setSubmitAttempted(false);
    }
    if (open && mode === 'edit' && child) {
      setValues({
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        gender: child.gender,
        phone: child.phone,
        fatherPhone: child.fatherPhone ?? '',
        motherPhone: child.motherPhone ?? '',
        address: child.address ?? '',
        allergies: child.allergies ?? '',
        napSchedule: child.napSchedule ?? '',
        enrollmentStatus: child.enrollmentStatus,
        notes: child.notes ?? '',
      });
      setTouched({});
      setSubmitAttempted(false);
    }
  }, [open]);

  const errors = validate(values);

  function showError(field: keyof FormValues): boolean {
    return !!(( touched[field] || submitAttempted) && errors[field]);
  }

  function handleBlur(field: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) {
      const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
      if (firstInvalid) {
        document.getElementById(`child-form-${firstInvalid}`)?.focus();
      }
      return;
    }

    if (mode === 'add') {
      if (!activeYear) return;
      const newChild: Child = {
        id: crypto.randomUUID(),
        schoolYearId: activeYear.id,
        name: values.name.trim(),
        dateOfBirth: values.dateOfBirth,
        gender: values.gender as 'male' | 'female',
        phone: values.phone.trim(),
        fatherPhone: values.fatherPhone.trim() || undefined,
        motherPhone: values.motherPhone.trim() || undefined,
        address: values.address.trim() || undefined,
        allergies: values.allergies.trim() || undefined,
        napSchedule: values.napSchedule.trim() || undefined,
        enrollmentStatus: values.enrollmentStatus,
        notes: values.notes.trim() || undefined,
      };
      addChild(newChild);
    } else if (mode === 'edit' && child) {
      const updated: Child = {
        ...child,
        name: values.name.trim(),
        dateOfBirth: values.dateOfBirth,
        gender: values.gender as 'male' | 'female',
        phone: values.phone.trim(),
        fatherPhone: values.fatherPhone.trim() || undefined,
        motherPhone: values.motherPhone.trim() || undefined,
        address: values.address.trim() || undefined,
        allergies: values.allergies.trim() || undefined,
        napSchedule: values.napSchedule.trim() || undefined,
        enrollmentStatus: values.enrollmentStatus,
        notes: values.notes.trim() || undefined,
      };
      updateChild(updated);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Child' : 'Edit Child'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="child-form-name">
              Name <span className="text-rose-600" aria-hidden="true">*</span>
            </Label>
            <Input
              id="child-form-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              onBlur={() => handleBlur('name')}
              aria-invalid={showError('name') ? 'true' : undefined}
            />
            {showError('name') && (
              <p className="text-rose-600 text-sm mt-1" role="alert">{errors.name}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <Label htmlFor="child-form-dateOfBirth">
              Date of Birth <span className="text-rose-600" aria-hidden="true">*</span>
            </Label>
            <HebrewDatePicker
              id="child-form-dateOfBirth"
              value={values.dateOfBirth}
              onChange={(v) => setValues((prev) => ({ ...prev, dateOfBirth: v }))}
              onBlur={() => handleBlur('dateOfBirth')}
              aria-invalid={showError('dateOfBirth') ? 'true' : undefined}
            />
            {values.dateOfBirth && (
              <p className="text-stone-500 text-sm mt-1">{computeAge(values.dateOfBirth)}</p>
            )}
            {showError('dateOfBirth') && (
              <p className="text-rose-600 text-sm mt-1" role="alert">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <Label htmlFor="child-form-gender">
              Gender <span className="text-rose-600" aria-hidden="true">*</span>
            </Label>
            <Select
              value={values.gender}
              onValueChange={(v) => {
                setValues((prev) => ({ ...prev, gender: v as 'male' | 'female' }));
                handleBlur('gender');
              }}
            >
              <SelectTrigger id="child-form-gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            {showError('gender') && (
              <p className="text-rose-600 text-sm mt-1" role="alert">{errors.gender}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="child-form-phone">
              Phone <span className="text-rose-600" aria-hidden="true">*</span>
            </Label>
            <Input
              id="child-form-phone"
              type="tel"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              onBlur={() => handleBlur('phone')}
              aria-invalid={showError('phone') ? 'true' : undefined}
            />
            {showError('phone') && (
              <p className="text-rose-600 text-sm mt-1" role="alert">{errors.phone}</p>
            )}
          </div>

          {/* Father's Phone */}
          <div className="space-y-1">
            <Label htmlFor="child-form-fatherPhone">Father's Phone</Label>
            <Input
              id="child-form-fatherPhone"
              type="tel"
              value={values.fatherPhone}
              onChange={(e) => setValues((v) => ({ ...v, fatherPhone: e.target.value }))}
              onBlur={() => handleBlur('fatherPhone')}
              placeholder="Father's number"
            />
          </div>

          {/* Mother's Phone */}
          <div className="space-y-1">
            <Label htmlFor="child-form-motherPhone">Mother's Phone</Label>
            <Input
              id="child-form-motherPhone"
              type="tel"
              value={values.motherPhone}
              onChange={(e) => setValues((v) => ({ ...v, motherPhone: e.target.value }))}
              onBlur={() => handleBlur('motherPhone')}
              placeholder="Mother's number"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label htmlFor="child-form-address">Address</Label>
            <Input
              id="child-form-address"
              value={values.address}
              onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
              onBlur={() => handleBlur('address')}
              placeholder="Street, city"
            />
          </div>

          {/* Allergies */}
          <div className="space-y-1">
            <Label htmlFor="child-form-allergies">Allergies / Medical Notes</Label>
            <Textarea
              id="child-form-allergies"
              value={values.allergies}
              onChange={(e) => setValues((v) => ({ ...v, allergies: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Nap Schedule */}
          <div className="space-y-1">
            <Label htmlFor="child-form-napSchedule">Nap Schedule</Label>
            <Input
              id="child-form-napSchedule"
              value={values.napSchedule}
              onChange={(e) => setValues((v) => ({ ...v, napSchedule: e.target.value }))}
            />
          </div>

          {/* Enrollment Status */}
          <div className="space-y-1">
            <Label htmlFor="child-form-enrollmentStatus">
              Enrollment Status <span className="text-rose-600" aria-hidden="true">*</span>
            </Label>
            <Select
              value={values.enrollmentStatus}
              onValueChange={(v) => setValues((prev) => ({ ...prev, enrollmentStatus: v as EnrollmentStatus }))}
            >
              <SelectTrigger id="child-form-enrollmentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contract</SelectItem>
                <SelectItem value="contractReceived">Contract received</SelectItem>
                <SelectItem value="contractSigned">Contract signed</SelectItem>
                <SelectItem value="left">Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="child-form-notes">Notes</Label>
            <Textarea
              id="child-form-notes"
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-stone-300 text-stone-700 hover:bg-stone-50"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 text-white hover:bg-teal-800">
              Save Child
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
