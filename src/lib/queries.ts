import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { generateSlug } from './ids';
import type { Database } from '@/types/db';
import type { GoalType, Page, PersonScore, SectionWithSessions, Session } from '@/types/models';

export const qk = {
  page: (slug: string) => ['page', slug] as const,
  sections: (pageId: string) => ['sections', pageId] as const,
  people: (pageId: string) => ['people', pageId] as const,
  scores: (pageId: string) => ['scores', pageId] as const,
};

function invalidatePage(
  queryClient: ReturnType<typeof useQueryClient>,
  pageId: string | undefined,
) {
  if (!pageId) return;
  queryClient.invalidateQueries({ queryKey: qk.sections(pageId) });
  queryClient.invalidateQueries({ queryKey: qk.people(pageId) });
  queryClient.invalidateQueries({ queryKey: qk.scores(pageId) });
}

// --- Reads ---------------------------------------------------------------

export function usePage(slug: string | undefined) {
  return useQuery({
    queryKey: qk.page(slug ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page')
        .select('*')
        .eq('slug', slug!)
        .single();
      if (error) throw error;
      return data as Page;
    },
    enabled: !!slug,
  });
}

export function useSections(pageId: string | undefined) {
  return useQuery({
    queryKey: qk.sections(pageId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section')
        .select('*, session(*, session_person(person_id))')
        .eq('page_id', pageId!)
        .order('position', { ascending: true })
        .order('position', { ascending: true, referencedTable: 'session' });
      if (error) throw error;
      return data as SectionWithSessions[];
    },
    enabled: !!pageId,
  });
}

export function usePeople(pageId: string | undefined) {
  return useQuery({
    queryKey: qk.people(pageId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('person')
        .select('*')
        .eq('page_id', pageId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!pageId,
  });
}

export function usePersonScores(pageId: string | undefined) {
  return useQuery({
    queryKey: qk.scores(pageId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('person_score')
        .select('*')
        .eq('page_id', pageId!);
      if (error) throw error;
      const rows = data as PersonScore[];
      return [...rows].sort(
        (a, b) => b.coins - a.coins || b.sessions_done - a.sessions_done || a.name.localeCompare(b.name),
      );
    },
    enabled: !!pageId,
  });
}

// --- Realtime --------------------------------------------------------------

export function usePageRealtime(pageId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pageId) return;
    const channel = supabase
      .channel(`page:${pageId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session', filter: `page_id=eq.${pageId}` },
        () => invalidatePage(queryClient, pageId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'section', filter: `page_id=eq.${pageId}` },
        () => invalidatePage(queryClient, pageId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'person', filter: `page_id=eq.${pageId}` },
        () => invalidatePage(queryClient, pageId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_person' },
        () => invalidatePage(queryClient, pageId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, queryClient]);
}

// --- Mutations: page -------------------------------------------------------

export function useCreatePage() {
  return useMutation({
    mutationFn: async (input: {
      title: string;
      goalTitle?: string;
      goalType?: GoalType;
      goalTarget?: number;
      goalDeadline?: string;
    }) => {
      const { data, error } = await supabase
        .from('page')
        .insert({
          slug: generateSlug(),
          title: input.title,
          goal_title: input.goalTitle ?? null,
          goal_type: input.goalType ?? 'total_coins',
          goal_target: input.goalTarget ?? null,
          goal_deadline: input.goalDeadline ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as Page;
    },
  });
}

// --- Mutations: people -------------------------------------------------------

const PERSON_COLORS = [
  '#f97316', '#22c55e', '#3b82f6', '#ec4899',
  '#a855f7', '#14b8a6', '#eab308', '#ef4444',
];

export function useAddPerson(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: existing } = await supabase
        .from('person')
        .select('id')
        .eq('page_id', pageId!);
      const color = PERSON_COLORS[(existing?.length ?? 0) % PERSON_COLORS.length];
      const { data, error } = await supabase
        .from('person')
        .insert({ page_id: pageId!, name, color })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

export function useDeletePerson(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase.from('person').delete().eq('id', personId);
      if (error) throw error;
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

// --- Mutations: sections -------------------------------------------------------

export function useAddSection(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; position: number }) => {
      const { data, error } = await supabase
        .from('section')
        .insert({ page_id: pageId!, title: input.title, position: input.position })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

export function useDeleteSection(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from('section').delete().eq('id', sectionId);
      if (error) throw error;
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

// --- Mutations: sessions -------------------------------------------------------

export function useAddSession(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sectionId: string;
      title: string;
      note?: string;
      coinValue: number;
      personIds: string[];
      position: number;
    }) => {
      const { data: session, error } = await supabase
        .from('session')
        .insert({
          section_id: input.sectionId,
          page_id: pageId!,
          title: input.title,
          note: input.note || null,
          coin_value: input.coinValue,
          position: input.position,
        })
        .select('*')
        .single();
      if (error) throw error;

      if (input.personIds.length > 0) {
        const { error: linkError } = await supabase
          .from('session_person')
          .insert(input.personIds.map((personId) => ({ session_id: session.id, person_id: personId })));
        if (linkError) throw linkError;
      }
      return session;
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

export function useUpdateSession(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      title?: string;
      note?: string | null;
      coinValue?: number;
      personIds?: string[];
    }) => {
      const patch: Database['public']['Tables']['session']['Update'] = {
        updated_at: new Date().toISOString(),
      };
      if (input.title !== undefined) patch.title = input.title;
      if (input.note !== undefined) patch.note = input.note;
      if (input.coinValue !== undefined) patch.coin_value = input.coinValue;

      const { error } = await supabase.from('session').update(patch).eq('id', input.sessionId);
      if (error) throw error;

      if (input.personIds !== undefined) {
        const { error: deleteError } = await supabase
          .from('session_person')
          .delete()
          .eq('session_id', input.sessionId);
        if (deleteError) throw deleteError;
        if (input.personIds.length > 0) {
          const { error: linkError } = await supabase
            .from('session_person')
            .insert(input.personIds.map((personId) => ({ session_id: input.sessionId, person_id: personId })));
          if (linkError) throw linkError;
        }
      }
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

export function useDeleteSession(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('session').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}

export function useToggleSessionDone(pageId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: Session) => {
      const nextStatus = session.status === 'done' ? 'todo' : 'done';
      const { error } = await supabase
        .from('session')
        .update({
          status: nextStatus,
          done_at: nextStatus === 'done' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      if (error) throw error;
    },
    onMutate: async (session) => {
      if (!pageId) return;
      await queryClient.cancelQueries({ queryKey: qk.sections(pageId) });
      const previous = queryClient.getQueryData<SectionWithSessions[]>(qk.sections(pageId));
      queryClient.setQueryData<SectionWithSessions[]>(qk.sections(pageId), (old) =>
        old?.map((section) => ({
          ...section,
          session: section.session.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  status: s.status === 'done' ? 'todo' : 'done',
                  done_at: s.status === 'done' ? null : new Date().toISOString(),
                }
              : s,
          ),
        })),
      );
      return { previous };
    },
    onError: (_err, _session, context) => {
      if (pageId && context?.previous) {
        queryClient.setQueryData(qk.sections(pageId), context.previous);
      }
    },
    onSettled: () => invalidatePage(queryClient, pageId),
  });
}
