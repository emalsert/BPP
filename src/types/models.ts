// Refines src/types/db.ts (raw `supabase gen types` output, where CHECK
// constraints collapse to `string`) with the literal unions the app needs.
// Regenerate db.ts freely; this file doesn't need touching afterwards.
import type { Tables } from './db';

export type GoalType = 'total_coins' | 'total_sessions' | 'deadline';
export type SessionStatus = 'todo' | 'done';

export type Page = Omit<Tables<'page'>, 'goal_type'> & { goal_type: GoalType };
export type Person = Tables<'person'>;
export type Section = Tables<'section'>;
export type Session = Omit<Tables<'session'>, 'status'> & { status: SessionStatus };

export interface PersonScore {
  person_id: string;
  page_id: string;
  name: string;
  coins: number;
  sessions_done: number;
}

export interface SessionWithAttribution extends Session {
  session_person: { person_id: string }[];
}

export interface SectionWithSessions extends Section {
  session: SessionWithAttribution[];
}
