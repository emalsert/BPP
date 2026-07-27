import { ArrowsClockwise } from '@phosphor-icons/react';
import { useIdentity } from '@/hooks/useIdentity';
import { usePeople } from '@/lib/queries';

export function IdentitySwitcher({ pageSlug, pageId }: { pageSlug: string; pageId: string }) {
  const { personId, clear } = useIdentity(pageSlug);
  const { data: people } = usePeople(pageId);
  const me = people?.find((p) => p.id === personId);

  if (!me) return null;

  return (
    <button
      onClick={clear}
      className="flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/20"
      title="Changer d'identité"
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: me.color ?? '#94a3b8' }}
      />
      {me.name}
      <ArrowsClockwise size={16} />
    </button>
  );
}
