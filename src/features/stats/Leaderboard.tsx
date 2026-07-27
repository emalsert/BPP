import { useState } from 'react';
import { Coin, Trophy, CaretDown, CaretUp } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { usePersonScores, useSections } from '@/lib/queries';

export function Leaderboard({ pageId, selfId }: { pageId: string; selfId: string | null }) {
  const { data: scores } = usePersonScores(pageId);
  const { data: sections } = useSections(pageId);
  const [expanded, setExpanded] = useState<string | null>(null);

  const allSessions = sections?.flatMap((s) => s.session) ?? [];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card className="p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <Trophy weight="duotone" size={20} />
        Classement
      </h2>
      <ol className="space-y-1">
        {scores?.map((score, index) => {
          const attributed = allSessions.filter((s) =>
            s.session_person.some((sp) => sp.person_id === score.person_id),
          );
          const pending = attributed.filter((s) => s.status === 'todo').length;
          const total = attributed.length;
          const completionRate = total > 0 ? Math.round((score.sessions_done / total) * 100) : 0;
          const isSelf = score.person_id === selfId;
          const isExpanded = expanded === score.person_id;

          return (
            <li key={score.person_id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : score.person_id)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/10 ${
                  isSelf ? 'bg-white/10' : ''
                }`}
              >
                <span className="w-6 shrink-0 text-center text-sm text-white/50">
                  {medals[index] ?? index + 1}
                </span>
                <span className="flex-1 truncate text-white">{score.name}</span>
                <span className="flex items-center gap-1 text-sm text-amber-200">
                  <Coin size={16} weight="fill" />
                  {score.coins}
                </span>
                <span className="text-sm text-white/50">{score.sessions_done} faites</span>
                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
              </button>
              {isExpanded && (
                <div className="ml-8 mb-2 mt-1 text-sm text-white/60">
                  {pending} séance{pending !== 1 ? 's' : ''} en attente · {completionRate}% de complétion
                </div>
              )}
            </li>
          );
        })}
        {scores?.length === 0 && <p className="text-sm text-white/50">Pas encore de participant.</p>}
      </ol>
    </Card>
  );
}
