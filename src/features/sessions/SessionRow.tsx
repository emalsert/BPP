import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Coin, PencilSimple, Trash } from '@phosphor-icons/react';
import { useDeleteSession, useToggleSessionDone } from '@/lib/queries';
import { SessionFormDialog } from './SessionFormDialog';
import type { Person, SessionWithAttribution } from '@/types/models';

interface SessionRowProps {
  session: SessionWithAttribution;
  pageId: string;
  people: Person[];
  selfId: string | null;
}

export function SessionRow({ session, pageId, people, selfId }: SessionRowProps) {
  const [editing, setEditing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const toggleDone = useToggleSessionDone(pageId);
  const deleteSession = useDeleteSession(pageId);
  const isDone = session.status === 'done';

  const attributed = session.session_person
    .map((sp) => people.find((p) => p.id === sp.person_id))
    .filter((p): p is Person => !!p);

  useEffect(() => {
    if (!celebrate) return;
    const timeout = setTimeout(() => setCelebrate(false), 900);
    return () => clearTimeout(timeout);
  }, [celebrate]);

  function handleToggle() {
    if (!isDone) setCelebrate(true);
    toggleDone.mutate(session);
  }

  function handleDelete() {
    if (window.confirm(`Supprimer la séance "${session.title}" ?`)) {
      deleteSession.mutate(session.id);
    }
  }

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border border-white/10 p-3 ${
        isDone ? 'bg-white/5' : 'bg-white/[0.03]'
      }`}
    >
      <button
        onClick={handleToggle}
        className="relative mt-0.5 shrink-0 text-white/80 hover:text-white"
        aria-label={isDone ? 'Marquer à faire' : 'Marquer fait'}
      >
        {isDone ? (
          <CheckCircle weight="fill" size={26} className="text-emerald-400" />
        ) : (
          <Circle size={26} />
        )}
        {celebrate && (
          <span
            aria-hidden
            className="motion-safe:animate-bounce pointer-events-none absolute -right-2 -top-3 text-lg"
          >
            🎉
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium text-white ${isDone ? 'line-through opacity-70' : ''}`}>
          {session.title}
        </p>
        {session.note && <p className="mt-0.5 text-sm text-white/60">{session.note}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-200">
            <Coin size={14} weight="fill" />
            {session.coin_value}
          </span>
          {attributed.map((person) => (
            <span
              key={person.id}
              className="rounded-full px-2 py-0.5 text-xs text-white"
              style={{ backgroundColor: `${person.color ?? '#64748b'}55` }}
            >
              {person.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Modifier"
        >
          <PencilSimple size={18} />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg p-2 text-white/50 hover:bg-red-500/20 hover:text-red-200"
          aria-label="Supprimer"
        >
          <Trash size={18} />
        </button>
      </div>

      {editing && (
        <SessionFormDialog
          open={editing}
          onClose={() => setEditing(false)}
          pageId={pageId}
          sectionId={session.section_id}
          people={people}
          nextPosition={0}
          session={session}
          selfId={selfId}
        />
      )}
    </div>
  );
}
