export type JoinedProfile = { username: string | null; full_name: string | null; avatar_url: string | null };

/** Supabase nested `profiles(...)` can be an object or a single-element array depending on client typings. */
export function normalizeJoinedProfile(profiles: unknown): JoinedProfile | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) {
    const first = profiles[0] as JoinedProfile | undefined;
    return first ?? null;
  }
  return profiles as JoinedProfile;
}
