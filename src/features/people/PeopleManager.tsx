import { useState, type FormEvent } from 'react';
import { Users, Plus, X } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAddPerson, useDeletePerson, usePeople } from '@/lib/queries';

export function PeopleManager({ pageId }: { pageId: string }) {
  const { data: people } = usePeople(pageId);
  const addPerson = useAddPerson(pageId);
  const deletePerson = useDeletePerson(pageId);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await addPerson.mutateAsync(name.trim());
    setName('');
  }

  function handleRemove(personId: string, personName: string) {
    if (window.confirm(`Retirer ${personName} de la page ?`)) {
      deletePerson.mutate(personId);
    }
  }

  return (
    <Card className="p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-sm font-medium text-white/80"
      >
        <span className="flex items-center gap-2">
          <Users weight="duotone" size={18} />
          Participants ({people?.length ?? 0})
        </span>
        <span className="text-white/50">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {people?.map((person) => (
              <span
                key={person.id}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
                style={{ backgroundColor: `${person.color ?? '#64748b'}55` }}
              >
                {person.name}
                <button
                  onClick={() => handleRemove(person.id, person.name)}
                  aria-label={`Retirer ${person.name}`}
                  className="hover:text-red-200"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={handleAdd}>
            <Input
              placeholder="Nom du participant"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={addPerson.isPending}>
              <Plus size={16} />
              Ajouter
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
