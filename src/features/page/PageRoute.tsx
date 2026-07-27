import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePage, usePeople, usePersonScores, useSections, usePageRealtime } from '@/lib/queries';
import { useIdentity } from '@/hooks/useIdentity';
import { rememberPage } from '@/lib/identity';
import { PageShell } from './PageShell';
import { IdentityPrompt } from '@/features/people/IdentityPrompt';
import { PeopleManager } from '@/features/people/PeopleManager';
import { SectionsBoard } from '@/features/sections/SectionsBoard';
import { GoalProgress } from '@/features/stats/GoalProgress';

export function PageRoute() {
  const { slug = '' } = useParams();
  const { data: page, isLoading, isError } = usePage(slug);
  const { data: people } = usePeople(page?.id);
  const { data: scores } = usePersonScores(page?.id);
  const { data: sections } = useSections(page?.id);
  const { personId, isReady } = useIdentity(slug);
  usePageRealtime(page?.id);

  useEffect(() => {
    if (page) {
      rememberPage({ slug: page.slug, title: page.title, lastOpened: new Date().toISOString() });
    }
  }, [page]);

  if (isLoading) {
    return <p className="p-6 text-center text-white/60">Chargement...</p>;
  }

  if (isError || !page) {
    return <p className="p-6 text-center text-white/60">Cette page n'existe pas.</p>;
  }

  const totalCoins = scores?.reduce((sum, s) => sum + s.coins, 0) ?? 0;
  const totalSessionsDone =
    sections?.flatMap((s) => s.session).filter((s) => s.status === 'done').length ?? 0;

  return (
    <PageShell page={page}>
      <div className="space-y-4">
        <GoalProgress page={page} totalCoins={totalCoins} totalSessionsDone={totalSessionsDone} />
        {isReady && !personId && <IdentityPrompt pageSlug={slug} pageId={page.id} />}
        <PeopleManager pageId={page.id} />
        <SectionsBoard pageId={page.id} people={people ?? []} selfId={personId} />
      </div>
    </PageShell>
  );
}
