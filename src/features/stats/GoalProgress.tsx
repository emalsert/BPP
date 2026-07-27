import { Target, CalendarBlank } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import type { Page } from '@/types/models';

function daysRemaining(deadline: string): number {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function computeProgress(page: Page, totalCoins: number, totalSessionsDone: number): number | null {
  if (page.goal_type === 'total_coins') {
    return page.goal_target ? Math.min(1, totalCoins / page.goal_target) : null;
  }
  if (page.goal_type === 'total_sessions') {
    return page.goal_target ? Math.min(1, totalSessionsDone / page.goal_target) : null;
  }
  if (page.goal_type === 'deadline' && page.goal_deadline) {
    const start = new Date(page.created_at).getTime();
    const end = new Date(page.goal_deadline).getTime();
    const now = Date.now();
    if (end <= start) return 1;
    return Math.min(1, Math.max(0, (now - start) / (end - start)));
  }
  return null;
}

export function GoalProgress({
  page,
  totalCoins,
  totalSessionsDone,
}: {
  page: Page;
  totalCoins: number;
  totalSessionsDone: number;
}) {
  const progress = computeProgress(page, totalCoins, totalSessionsDone);
  const remaining = page.goal_deadline ? daysRemaining(page.goal_deadline) : null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Target weight="duotone" size={20} />
          {page.goal_title || 'Objectif'}
          {progress !== null && progress >= 1 && <span aria-hidden>🏆</span>}
        </h2>
        {remaining !== null && (
          <span className="flex items-center gap-1 text-sm text-white/60">
            <CalendarBlank size={16} />
            {remaining >= 0 ? `${remaining} j restants` : 'échéance dépassée'}
          </span>
        )}
      </div>

      {progress !== null && (
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex gap-6 text-sm text-white/70">
        <span>
          <strong className="text-white">{totalCoins}</strong> pièces
        </span>
        <span>
          <strong className="text-white">{totalSessionsDone}</strong> séances faites
        </span>
        {page.goal_type !== 'deadline' && page.goal_target && (
          <span>
            objectif : <strong className="text-white">{page.goal_target}</strong>
          </span>
        )}
      </div>
    </Card>
  );
}
