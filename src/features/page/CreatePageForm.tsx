import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreatePage } from '@/lib/queries';
import { rememberPage } from '@/lib/identity';
import type { GoalType } from '@/types/models';

export function CreatePageForm() {
  const navigate = useNavigate();
  const createPage = useCreatePage();
  const [title, setTitle] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('total_coins');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    const page = await createPage.mutateAsync({
      title: title.trim(),
      goalTitle: goalTitle.trim() || undefined,
      goalType,
      goalTarget: goalTarget ? Number(goalTarget) : undefined,
      goalDeadline: goalDeadline || undefined,
    });

    rememberPage({ slug: page.slug, title: page.title, lastOpened: new Date().toISOString() });
    navigate(`/p/${page.slug}`);
  }

  return (
    <Card className="p-6">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold text-white">
        <Rocket weight="duotone" size={24} />
        Créer une page
      </h1>
      <p className="mb-5 text-sm text-white/60">
        Un objectif partagé, sans compte à créer.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm text-white/80" htmlFor="title">
            Titre de la page
          </label>
          <Input
            id="title"
            placeholder="Ex. Prépa Hyrox"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/80" htmlFor="goalTitle">
            Objectif (optionnel)
          </label>
          <Input
            id="goalTitle"
            placeholder="Ex. Hyrox octobre 2026"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="goalType">
              Type d'objectif
            </label>
            <select
              id="goalType"
              className="min-h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white outline-none focus:border-white/50"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as GoalType)}
            >
              <option className="text-slate-900" value="total_coins">Total de pièces</option>
              <option className="text-slate-900" value="total_sessions">Total de séances</option>
              <option className="text-slate-900" value="deadline">Échéance</option>
            </select>
          </div>
          {goalType !== 'deadline' && (
            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="goalTarget">
                Cible
              </label>
              <Input
                id="goalTarget"
                type="number"
                min="0"
                placeholder="100"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
              />
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/80" htmlFor="goalDeadline">
            Échéance (optionnel)
          </label>
          <Input
            id="goalDeadline"
            type="date"
            value={goalDeadline}
            onChange={(e) => setGoalDeadline(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={createPage.isPending}>
          {createPage.isPending ? 'Création...' : 'Créer la page'}
        </Button>
        {createPage.isError && (
          <p className="text-sm text-red-300">Une erreur est survenue, réessaie.</p>
        )}
      </form>
    </Card>
  );
}
