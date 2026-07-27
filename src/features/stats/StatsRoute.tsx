import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { usePage, usePersonScores, useSections, usePageRealtime } from '@/lib/queries';
import { useIdentity } from '@/hooks/useIdentity';
import { PageShell } from '@/features/page/PageShell';
import { GoalProgress } from './GoalProgress';
import { Leaderboard } from './Leaderboard';

export function StatsRoute() {
  const { slug = '' } = useParams();
  const { data: page, isLoading, isError } = usePage(slug);
  const { data: scores } = usePersonScores(page?.id);
  const { data: sections } = useSections(page?.id);
  const { personId } = useIdentity(slug);
  usePageRealtime(page?.id);

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
    <PageShell page={page} statsLink={false}>
      <Link
        to={`/p/${page.slug}`}
        className="mb-4 flex items-center gap-1 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft size={16} />
        Retour à la page
      </Link>
      <div className="space-y-4">
        <GoalProgress page={page} totalCoins={totalCoins} totalSessionsDone={totalSessionsDone} />
        <Leaderboard pageId={page.id} selfId={personId} />
      </div>
    </PageShell>
  );
}
