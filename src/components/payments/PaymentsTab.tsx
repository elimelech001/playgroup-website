import { useActiveYear } from '@/store';
import { PaymentGrid } from './PaymentGrid';

export function PaymentsTab() {
  const activeYear = useActiveYear();

  if (!activeYear) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-stone-500">No active school year. Create one using the school year switcher.</p>
      </div>
    );
  }

  return <PaymentGrid />;
}
