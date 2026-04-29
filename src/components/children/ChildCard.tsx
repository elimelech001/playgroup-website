import { Phone, AlertTriangle, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { computeAge } from '@/lib/ageUtils';
import type { Child, EnrollmentStatus } from '@/types';

interface ChildCardProps {
  child: Child;
  onSelect: (child: Child) => void;
}

const AVATAR_COLORS = [
  'bg-teal-500',
  'bg-blue-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-amber-500',
] as const;

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % 5];
}

const ENROLLMENT_BADGE: Record<EnrollmentStatus, { label: string; className: string }> = {
  none: { label: 'No contract', className: 'bg-stone-100 text-stone-600' },
  contractReceived: { label: 'Contract received', className: 'bg-amber-100 text-amber-700' },
  contractSigned: { label: 'Contract signed', className: 'bg-emerald-100 text-emerald-700' },
  left: { label: 'Left', className: 'bg-rose-100 text-rose-700' },
};

export function ChildCard({ child, onSelect }: ChildCardProps) {
  const avatarColor = getAvatarColor(child.name);
  const badge = ENROLLMENT_BADGE[child.enrollmentStatus];
  const age = computeAge(child.dateOfBirth);

  return (
    <div
      role="listitem"
      aria-label={`Child profile: ${child.name}`}
      onClick={() => onSelect(child)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(child)}
      tabIndex={0}
      className="bg-white border border-stone-200 rounded-xl p-4 hover:border-teal-700 hover:shadow-sm transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg ${avatarColor}`}
          aria-hidden="true"
        >
          {child.name.charAt(0).toUpperCase()}
        </div>
        <Badge className={`text-xs font-medium border-0 ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>

      <p className="font-semibold text-stone-800 leading-snug">{child.name}</p>

      {age && <p className="text-stone-500 text-sm mt-0.5">{age}</p>}

      <div className="flex items-center gap-1.5 mt-2 text-stone-600 text-sm">
        <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="tabular-nums">{child.phone}</span>
      </div>

      {child.allergies && (
        <div className="flex items-start gap-1.5 mt-1.5 text-rose-700 text-sm">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{child.allergies}</span>
        </div>
      )}

      {child.napSchedule && (
        <div className="flex items-center gap-1.5 mt-1.5 text-blue-700 text-sm">
          <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{child.napSchedule}</span>
        </div>
      )}
    </div>
  );
}
