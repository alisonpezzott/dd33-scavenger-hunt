import { describe, expect, it } from 'vitest';
import type { CompletionRecord } from '@rayfin-app/shared';
import { leaderboard } from './hunt';

function entry(owner: string, challengeId: string): CompletionRecord {
  return { id: `${owner}-${challengeId}`, owner_id: owner, completionKey: `${owner}:${challengeId}`, playerName: owner, challengeId, note: 'A conference memory' };
}

describe('leaderboard', () => {
  it('counts unique valid challenges only and shares ranks for equal scores', () => {
    const players = leaderboard([
      entry('Alex', 'coffee'), entry('Alex', 'speaker'), entry('Alex', 'coffee'),
      entry('Sam', 'icebreaker'), entry('Sam', 'demo'), entry('Sam', 'not-a-challenge'),
      entry('Taylor', 'takeaway'),
    ]);
    expect(players.map(({ name, score, rank }) => ({ name, score, rank }))).toEqual([
      { name: 'Alex', score: 2, rank: 1 },
      { name: 'Sam', score: 2, rank: 1 },
      { name: 'Taylor', score: 1, rank: 3 },
    ]);
  });
});
