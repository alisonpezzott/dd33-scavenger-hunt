/**
 * Browser-safe contracts shared by the data registration package and frontend.
 *
 * Keep each record shape aligned with its decorated runtime entity in
 * `@rayfin-app/data`. This package must stay isomorphic, so do not import the
 * decorated classes here.
 */
export interface CompletionRecord {
  id: string;
  owner_id: string;
  completionKey: string;
  challengeId: string;
  playerName: string;
  note: string;
}

export type UniversalAppSchema = {
  Completion: CompletionRecord;
};
