import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_BASE_URL || 'https://imbkdj7v.eu-central.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTQwMjF9.8aed021YJ4pi4Ud-HTcRxjj_qx_FBm2GdFzBTvol3RY'
});

// Type for game score record
export interface GameScore {
  id: string;
  user_id: string;
  score: number;
  highest_element: number;
  lines_cleared: number;
  victory: boolean;
  played_at: string;
  created_at: string;
  users?: {
    name: string | null;
    email: string;
  };
}

// Save a game score
export async function saveGameScore(
  userId: string,
  score: number,
  highestElement: number,
  linesCleared: number,
  victory: boolean
): Promise<{ data: GameScore | null; error: Error | null }> {
  const { data, error } = await insforge.database
    .from('game_scores')
    .insert([{
      user_id: userId,
      score,
      highest_element: highestElement,
      lines_cleared: linesCleared,
      victory
    }])
    .select()
    .single();

  return { data, error };
}

// Get top scores for leaderboard
export async function getLeaderboard(limit: number = 10): Promise<{ data: GameScore[] | null; error: Error | null }> {
  const { data, error } = await insforge.database
    .from('game_scores')
    .select('*, users(name, email)')
    .order('score', { ascending: false })
    .limit(limit);

  return { data, error };
}

// Get user's personal best scores
export async function getUserScores(userId: string, limit: number = 5): Promise<{ data: GameScore[] | null; error: Error | null }> {
  const { data, error } = await insforge.database
    .from('game_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(limit);

  return { data, error };
}
