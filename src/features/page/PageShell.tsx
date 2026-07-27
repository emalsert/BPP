import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChartBar, House } from '@phosphor-icons/react';
import { ShareButton } from './ShareButton';
import { IdentitySwitcher } from '@/features/people/IdentitySwitcher';
import type { Page } from '@/types/models';

export function PageShell({
  page,
  statsLink,
  children,
}: {
  page: Page;
  statsLink?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
            <House size={14} />
            Tally
          </Link>
          <h1 className="text-2xl font-semibold text-white">{page.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <IdentitySwitcher pageSlug={page.slug} pageId={page.id} />
          <ShareButton slug={page.slug} title={page.title} />
        </div>
      </header>

      {statsLink !== false && (
        <Link
          to={`/p/${page.slug}/stats`}
          className="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm text-white/80 hover:bg-white/10"
        >
          <ChartBar size={16} />
          Voir les stats
        </Link>
      )}

      {children}
    </div>
  );
}
