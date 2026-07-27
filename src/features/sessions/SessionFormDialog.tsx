import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useAddSession, useUpdateSession } from '@/lib/queries';
import type { Person, SessionWithAttribution } from '@/types/models';

interface SessionFormDialogProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  sectionId: string;
  people: Person[];
  nextPosition: number;
  session?: SessionWithAttribution;
  selfId?: string | null;
}

export function SessionFormDialog({
  open,
  onClose,
  pageId,
  sectionId,
  people,
  nextPosition,
  session,
  selfId,
}: SessionFormDialogProps) {
  const isEditing = !!session;
  const [title, setTitle] = useState(session?.title ?? '');
  const [note, setNote] = useState(session?.note ?? '');
  const [coinValue, setCoinValue] = useState(String(session?.coin_value ?? 1));
  const [personIds, setPersonIds] = useState<string[]>(
    session?.session_person.map((sp) => sp.person_id) ?? (selfId ? [selfId] : []),
  );

  const addSession = useAddSession(pageId);
  const updateSession = useUpdateSession(pageId);
  const isPending = addSession.isPending || updateSession.isPending;

  function togglePerson(personId: string) {
    setPersonIds((current) =>
      current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    if (isEditing) {
      await updateSession.mutateAsync({
        sessionId: session.id,
        title: title.trim(),
        note: note.trim() || null,
        coinValue: Number(coinValue) || 1,
        personIds,
      });
    } else {
      await addSession.mutateAsync({
        sectionId,
        title: title.trim(),
        note: note.trim() || undefined,
        coinValue: Number(coinValue) || 1,
        personIds,
        position: nextPosition,
      });
    }
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEditing ? 'Modifier la séance' : 'Nouvelle séance'}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm text-white/80" htmlFor="session-title">
            Titre
          </label>
          <Input
            id="session-title"
            placeholder="Ex. 5 km footing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/80" htmlFor="session-note">
            Note (optionnel)
          </label>
          <Textarea
            id="session-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/80" htmlFor="session-coins">
            Valeur en pièces
          </label>
          <Input
            id="session-coins"
            type="number"
            min="0"
            value={coinValue}
            onChange={(e) => setCoinValue(e.target.value)}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm text-white/80">Participants</span>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => {
              const active = personIds.includes(person.id);
              return (
                <button
                  type="button"
                  key={person.id}
                  onClick={() => togglePerson(person.id)}
                  className={`min-h-11 rounded-xl border px-3 text-sm ${
                    active
                      ? 'border-white/50 bg-white/25 text-white'
                      : 'border-white/15 bg-white/5 text-white/70'
                  }`}
                >
                  {person.name}
                </button>
              );
            })}
            {people.length === 0 && (
              <p className="text-sm text-white/50">Ajoute des participants d'abord.</p>
            )}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isEditing ? 'Enregistrer' : 'Ajouter la séance'}
        </Button>
      </form>
    </Dialog>
  );
}
