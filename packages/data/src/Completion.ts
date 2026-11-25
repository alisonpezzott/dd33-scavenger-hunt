import { authenticated, entity, text, uuid } from '@microsoft/rayfin-core';

@entity()
@authenticated('read')
@authenticated('create', {
  policy: (claims, completion) => claims.sub.eq(completion.owner_id),
})
@authenticated('update', {
  policy: (claims, completion) => claims.sub.eq(completion.owner_id),
  include: ['note', 'playerName'],
})
@authenticated('delete', {
  policy: (claims, completion) => claims.sub.eq(completion.owner_id),
})
export class Completion {
  @uuid() id!: string;
  @text({ max: 200 }) owner_id!: string;
  @text({ max: 240, unique: true }) completionKey!: string;
  @text({ max: 30 }) challengeId!: string;
  @text({ min: 1, max: 60 }) playerName!: string;
  @text({ min: 1, max: 240 }) note!: string;
}
