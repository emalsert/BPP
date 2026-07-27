import { useState, type FormEvent } from 'react';
import { UserCircle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddPerson, usePeople } from '@/lib/queries';
import { useIdentity } from '@/hooks/useIdentity';
import type { Person } from '@/types/models';

export function IdentityPrompt({ pageSlug, pageId }: { pageSlug: string; pageId: string }) {
  const { data: people } = usePeople(pageId);
  const addPerson = useAddPerson(pageId);
  const { choose } = useIdentity(pageSlug);
  const [name, setName] = useState('');

  async function handleAddMe(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const person = await addPerson.mutateAsync(name.trim());
    choose(person.id);
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
        <UserCircle weight="duotone" size={22} />
        Qui es-tu ?
      </h2>
      {people && people.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {people.map((person: Person) => (
            <button
              key={person.id}
              onClick={() => choose(person.id)}
              className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
            >
              {person.name}
            </button>
          ))}
        </div>
      )}
      <form className="flex gap-2" onSubmit={handleAddMe}>
        <Input
          placeholder="Ton prénom"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={addPerson.isPending}>
          Ajoute-moi
        </Button>
      </form>
    </Card>
  );
}
