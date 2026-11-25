import type { CompletionRecord } from '@rayfin-app/shared';
import { getRayfinClient } from '@/lib/rayfin-client';

export const huntApi = {
  async list(): Promise<CompletionRecord[]> {
    const client = await getRayfinClient();
    const records: CompletionRecord[] = [];
    let cursor: string | undefined;
    do {
      const query = client.data.Completion
        .select(['id', 'owner_id', 'completionKey', 'challengeId', 'playerName', 'note'])
        .orderBy({ id: 'asc' }).first(100);
      const page = await (cursor ? query.after(cursor) : query).executePaginated();
      records.push(...page.items);
      if (!page.hasNextPage) break;
      if (!page.endCursor || page.endCursor === cursor) {
        throw new Error('The leaderboard could not finish loading. Please refresh.');
      }
      cursor = page.endCursor;
    } while (cursor);
    return records;
  },
  async create(input: Omit<CompletionRecord, 'id'>): Promise<CompletionRecord> {
    const client = await getRayfinClient();
    const session = client.auth.getSession();
    if (!session.isAuthenticated || !session.user || session.user.id !== input.owner_id) {
      throw new Error('Please sign in again before saving your challenge.');
    }
    return client.data.Completion.create(input);
  },
  async update(id: string, patch: Partial<Omit<CompletionRecord, 'id'>>) {
    return (await getRayfinClient()).data.Completion.update(
      { id }, { note: patch.note, playerName: patch.playerName },
    );
  },
  async remove(id: string) {
    await (await getRayfinClient()).data.Completion.delete({ id });
  },
};
