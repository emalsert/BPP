import { useSections } from '@/lib/queries';
import { SectionCard } from './SectionCard';
import { AddSectionForm } from './AddSectionForm';
import type { Person } from '@/types/models';

export function SectionsBoard({
  pageId,
  people,
  selfId,
}: {
  pageId: string;
  people: Person[];
  selfId: string | null;
}) {
  const { data: sections, isLoading } = useSections(pageId);

  if (isLoading) {
    return <p className="text-white/60">Chargement...</p>;
  }

  const nextPosition = sections?.length ?? 0;

  return (
    <div className="space-y-4">
      {sections?.map((section) => (
        <SectionCard key={section.id} section={section} pageId={pageId} people={people} selfId={selfId} />
      ))}
      {sections?.length === 0 && (
        <p className="text-center text-white/50">Pas encore de section, ajoute la première.</p>
      )}
      <AddSectionForm pageId={pageId} nextPosition={nextPosition} />
    </div>
  );
}
