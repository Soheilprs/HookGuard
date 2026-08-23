import { AppShell } from '@/components/layout/app-shell';
import { CardsLoadingState } from '@/components/loading-state';

export default function MethodologyLoading() {
  return (
    <AppShell>
      <CardsLoadingState />
    </AppShell>
  );
}
