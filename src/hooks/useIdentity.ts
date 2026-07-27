import { useEffect } from 'react';
import { create } from 'zustand';
import { getLocalIdentity, setLocalIdentity, clearLocalIdentity } from '@/lib/identity';

// undefined = not yet hydrated from localStorage, null = hydrated, no identity chosen
interface IdentityState {
  byPage: Record<string, string | null | undefined>;
  hydrate: (pageSlug: string) => void;
  choose: (pageSlug: string, personId: string) => void;
  clear: (pageSlug: string) => void;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  byPage: {},
  hydrate: (pageSlug) => {
    if (pageSlug in get().byPage) return;
    set((state) => ({ byPage: { ...state.byPage, [pageSlug]: getLocalIdentity(pageSlug) } }));
  },
  choose: (pageSlug, personId) => {
    setLocalIdentity(pageSlug, personId);
    set((state) => ({ byPage: { ...state.byPage, [pageSlug]: personId } }));
  },
  clear: (pageSlug) => {
    clearLocalIdentity(pageSlug);
    set((state) => ({ byPage: { ...state.byPage, [pageSlug]: null } }));
  },
}));

export function useIdentity(pageSlug: string) {
  const personId = useIdentityStore((state) => state.byPage[pageSlug]);
  const hydrate = useIdentityStore((state) => state.hydrate);
  const choose = useIdentityStore((state) => state.choose);
  const clear = useIdentityStore((state) => state.clear);

  useEffect(() => {
    hydrate(pageSlug);
  }, [pageSlug, hydrate]);

  return {
    personId: personId ?? null,
    isReady: personId !== undefined,
    choose: (personId: string) => choose(pageSlug, personId),
    clear: () => clear(pageSlug),
  };
}
