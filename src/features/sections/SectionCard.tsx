import { useState } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { useDeleteSection } from '@/lib/queries';
import { SessionRow } from '@/features/sessions/SessionRow';
import { SessionFormDialog } from '@/features/sessions/SessionFormDialog';
import type { Person, SectionWithSessions } from '@/types/models';

interface SectionCardProps {
  section: SectionWithSessions;
  pageId: string;
  people: Person[];
  selfId: string | null;
}

export function SectionCard({ section, pageId, people, selfId }: SectionCardProps) {
  const [addingSession, setAddingSession] = useState(false);
  const deleteSection = useDeleteSection(pageId);

  function handleDeleteSection() {
    if (window.confirm(`Supprimer la section "${section.title}" et toutes ses séances ?`)) {
      deleteSection.mutate(section.id);
    }
  }

  const nextPosition = section.session.length;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{section.title}</h3>
        <button
          onClick={handleDeleteSection}
          className="rounded-lg p-2 text-white/40 hover:bg-red-500/20 hover:text-red-200"
          aria-label="Supprimer la section"
        >
          <Trash size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {section.session.map((session) => (
          <SessionRow key={session.id} session={session} pageId={pageId} people={people} selfId={selfId} />
        ))}
        {section.session.length === 0 && (
          <p className="py-2 text-sm text-white/50">Pas encore de séance.</p>
        )}
      </div>

      <button
        onClick={() => setAddingSession(true)}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-sm text-white/70 hover:border-white/40 hover:text-white"
      >
        <Plus size={16} />
        Ajouter une séance
      </button>

      {addingSession && (
        <SessionFormDialog
          open={addingSession}
          onClose={() => setAddingSession(false)}
          pageId={pageId}
          sectionId={section.id}
          people={people}
          nextPosition={nextPosition}
          selfId={selfId}
        />
      )}
    </Card>
  );
}
