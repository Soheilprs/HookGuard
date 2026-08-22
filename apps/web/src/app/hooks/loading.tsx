import { AppShell } from '@/components/layout/app-shell';
import { TableLoadingState } from '@/components/loading-state';

export default function HooksLoading() {
  return (
    <AppShell>
      <div className="rounded-xl border border-border">
        <TableLoadingState />
      </div>
    </AppShell>
  );
}
