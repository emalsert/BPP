import { useState, type FormEvent } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAddSection } from '@/lib/queries';

export function AddSectionForm({ pageId, nextPosition }: { pageId: string; nextPosition: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const addSection = useAddSection(pageId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await addSection.mutateAsync({ title: title.trim(), position: nextPosition });
    setTitle('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 py-4 text-white/70 hover:border-white/40 hover:text-white"
      >
        <Plus size={18} />
        Ajouter une section
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        autoFocus
        placeholder="Ex. Course à pied"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !title.trim() && setOpen(false)}
      />
      <Button type="submit" disabled={addSection.isPending}>
        Ajouter
      </Button>
    </form>
  );
}
