import type { CompletionRecord } from '@rayfin-app/shared';

export const challenges = [
  { id: 'icebreaker', title: 'Break the ice', category: 'Connect', description: 'Introduce yourself to someone you have never met. Discover one thing you have in common.' },
  { id: 'new-perspective', title: 'Find a fresh perspective', category: 'Discover', description: 'Attend a session outside your usual area. Write down an idea that surprised you.' },
  { id: 'speaker', title: 'Ask the expert', category: 'Connect', description: 'Ask a speaker a thoughtful question after their session. What did you learn?' },
  { id: 'demo', title: 'Take a demo detour', category: 'Discover', description: 'Visit an exhibitor and try a hands-on demo. Find something you would love to use.' },
  { id: 'coffee', title: 'Make a coffee connection', category: 'Connect', description: 'Share a coffee break with a new conference friend. Ask what they are working on.' },
  { id: 'takeaway', title: 'Pass on a little wisdom', category: 'Share', description: 'Share your favorite session takeaway with another attendee. Good ideas travel.' },
  { id: 'international', title: 'Go beyond your bubble', category: 'Connect', description: 'Meet someone from a different city or country. Ask about their local tech community.' },
  { id: 'hidden-gem', title: 'Find the hidden gem', category: 'Discover', description: 'Explore a corner of the venue you have not visited. Tell us what you discovered.' },
  { id: 'thank-you', title: 'Give a little gratitude', category: 'Share', description: 'Thank a volunteer or organizer. Let them know one thing that made your day better.' },
  { id: 'next-step', title: 'Bring the spark home', category: 'Share', description: 'Choose one idea from the conference to try next week. Share your first small step.' },
] as const;

export type Challenge = typeof challenges[number];
export type HuntFilter = 'All challenges' | 'To do' | 'Completed';

export interface Player {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export function leaderboard(completions: readonly CompletionRecord[]): Player[] {
  const players = new Map<string, { name: string; done: Set<string> }>();
  const valid = new Set<string>(challenges.map((challenge) => challenge.id));
  for (const completion of completions) {
    if (!valid.has(completion.challengeId)) continue;
    const player = players.get(completion.owner_id) ?? {
      name: completion.playerName.trim() || 'Conference explorer',
      done: new Set<string>(),
    };
    player.done.add(completion.challengeId);
    players.set(completion.owner_id, player);
  }
  const sorted = [...players].map(([id, player]) => ({
    id, name: player.name, score: player.done.size, rank: 0,
  })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  return sorted.map((player, index) => ({
    ...player,
    rank: index > 0 && sorted[index - 1].score === player.score
      ? sorted.findIndex((entry) => entry.score === player.score) + 1
      : index + 1,
  }));
}
