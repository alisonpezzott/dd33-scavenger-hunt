import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowRight, Check, CheckCheck, Compass, Flag, Globe2, Lightbulb, Map, Moon, Plus, RefreshCw, Sparkles, Sun, Trophy, Users, X } from 'lucide-react';
import type { CompletionRecord } from '@rayfin-app/shared';
import { useAuth } from '@/hooks/auth.context';
import { useTheme } from '@/hooks/theme.context';
import { useCrud } from '@/components/useCrud';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { challenges, leaderboard, type Challenge, type HuntFilter } from '@/lib/hunt';
import { huntApi } from '@/services/hunt.service';
import { cn } from '@/lib/utils';

const categoryStyle = {
  Connect: 'bg-lilac text-lilac-foreground',
  Discover: 'bg-sky text-sky-foreground',
  Share: 'bg-gold text-gold-foreground',
};
const categoryIcon = { Connect: Users, Discover: Compass, Share: Lightbulb };
const primaryButton = 'inline-flex items-center justify-center gap-200 rounded-xl bg-primary px-500 py-300 text-300 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50';
const quietButton = 'inline-flex items-center justify-center gap-200 rounded-xl border px-400 py-300 text-300 font-medium transition-colors hover:bg-muted disabled:opacity-50';

function App() {
  const { session } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const crud = useCrud(huntApi);
  const [filter, setFilter] = useState<HuntFilter>('All challenges');
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [notice, setNotice] = useState('');
  const ownerId = session?.user?.id;
  const mine = crud.items.filter((entry) => entry.owner_id === ownerId);
  const completedIds = new Set(mine.map((entry) => entry.challengeId));
  const done = challenges.filter((challenge) => completedIds.has(challenge.id)).length;
  const players = leaderboard(crud.items);
  const myRank = players.find((player) => player.id === ownerId)?.rank;
  const ready = crud.status === 'ready';
  const visible = challenges.filter((challenge) => filter === 'All challenges'
    || (filter === 'Completed' ? completedIds.has(challenge.id) : !completedIds.has(challenge.id)));
  const selectedCompletion = mine.find((entry) => entry.challengeId === selected?.id);

  return (
    <div className="min-h-full">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-hunt flex-wrap items-center justify-between gap-400 px-600 py-500 lg:px-800">
          <a href="#top" className="flex items-center gap-300 font-heading text-500 font-bold">
            <span className="rounded-xl bg-primary p-200 text-primary-foreground"><Compass className="icon-size-400" /></span>
            Scavenger Hunt<span className="hidden text-200 font-medium text-muted-foreground sm:inline">/ CONFERENCE EDITION</span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-500 text-300 font-medium">
            <a href="#challenges" className="hover:text-primary">The challenges</a>
            <a href="#leaderboard" className="hover:text-primary">Leaderboard</a>
            <button type="button" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} className="rounded-full border p-200 text-muted-foreground hover:bg-muted">
              {isDark ? <Sun className="icon-size-300" /> : <Moon className="icon-size-300" />}
            </button>
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-hunt px-600 pb-section pt-800 lg:px-800">
        <section className="relative overflow-hidden rounded-3xl bg-hero px-600 py-800 text-hero-foreground md:px-hero md:py-hero" aria-labelledby="hunt-title">
          <div className="relative z-10 max-w-copy">
            <div className="mb-500 flex items-center gap-200 text-200 font-bold uppercase tracking-widest"><span className="h-200 w-200 rounded-full bg-primary" />A little curiosity. A lot of connection.</div>
            <h1 id="hunt-title" className="font-heading text-hero-900 font-bold leading-hero-800 tracking-tight md:text-hero-1000 md:leading-display">Great people.<br />Good adventures.</h1>
            <p className="mt-600 max-w-copy text-400 leading-500 text-hero-foreground/80">There is more to a conference than the sessions.<br className="hidden md:block" /> Meet someone new, try something different, and make it a day to remember.</p>
            <a href="#challenges" className={`${primaryButton} mt-600`}>Let the hunt begin<ArrowDown className="icon-size-200" /></a>
            <span className="ml-400 inline-block pt-300 text-200 text-hero-foreground/70">10 challenges. Endless possibilities.</span>
          </div>
          <div aria-hidden="true" className="absolute right-hero top-hero hidden h-art w-art items-center justify-center rounded-full border border-hero-foreground/15 lg:flex">
            <span className="absolute -top-300 bg-hero px-300 font-heading text-300">N</span>
            <span className="absolute -bottom-300 bg-hero px-300 font-heading text-300">S</span>
            <span className="absolute -left-300 bg-hero px-300 font-heading text-300">W</span>
            <span className="absolute -right-300 bg-hero px-300 font-heading text-300">E</span>
            <div className="flex h-art-inner w-art-inner rotate-12 items-center justify-center rounded-full border border-dashed border-hero-foreground/30"><Compass strokeWidth={0.8} className="icon-size-map -rotate-45 text-primary" /></div>
            <span className="absolute -bottom-500 -right-500 rotate-12 rounded-xl bg-card px-400 py-300 font-heading text-300 text-primary shadow-sm"><Sparkles className="mr-200 inline icon-size-200" />Stay curious</span>
          </div>
        </section>

        <section aria-label="Your progress" className="my-600 grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-3">
          <div className="flex items-center gap-400 border-b p-500 sm:border-b-0 sm:border-r">
            <div className="rounded-xl bg-accent p-300 text-accent-foreground"><Flag className="icon-size-400" /></div>
            <div className="flex-1"><p className="text-200 text-muted-foreground">YOUR ADVENTURE</p><p className="mt-100 font-heading text-500 font-bold">{ready ? `${done} / 10` : '-- / 10'} <span className="text-300 font-normal text-muted-foreground">completed</span></p>
              <progress aria-label="Challenges completed" max={10} value={ready ? done : 0} className="mt-200 block h-100 w-full overflow-hidden rounded-full accent-primary" />
            </div>
          </div>
          <div className="flex items-center gap-400 border-b p-500 sm:border-b-0 sm:border-r"><div className="rounded-xl bg-gold p-300 text-gold-foreground"><Trophy className="icon-size-400" /></div><div><p className="text-200 text-muted-foreground">YOUR PLACE</p><p className="mt-100 font-heading text-500 font-bold">{ready ? myRank ? `#${myRank}` : 'Unranked' : '--'}<span className="ml-200 text-300 font-normal text-muted-foreground">{ready && myRank ? 'on the leaderboard' : 'Your first challenge awaits'}</span></p></div></div>
          <div className="flex items-center gap-400 p-500"><div className="rounded-xl bg-success-soft p-300 text-success"><Globe2 className="icon-size-400" /></div><div><p className="text-200 text-muted-foreground">BETTER TOGETHER</p><p className="mt-100 font-heading text-500 font-bold">{ready ? players.length : '--'}<span className="ml-200 text-300 font-normal text-muted-foreground">explorers on the board</span></p></div></div>
        </section>

        <div className="mb-500" role="status" aria-live="polite">{notice}</div>
        {crud.status === 'error' && <div className="mb-600"><ErrorState message={crud.error!} onRetry={() => void crud.refresh()} /></div>}
        {!selected && ready && crud.error && <div className="mb-600"><ErrorState message={crud.error} onRetry={() => void crud.refresh()} /></div>}
        {ready && !ownerId && <div className="mb-600"><ErrorState message="Your sign-in did not provide a player identity. Reload or sign in again before completing a challenge." /></div>}

        <div className="grid items-start gap-800 lg:grid-cols-[minmax(0,1fr)_var(--spacing-leader)]">
          <section id="challenges" className="scroll-mt-600" aria-labelledby="challenges-title">
            <div className="mb-500 flex items-end justify-between gap-300">
              <div><p className="mb-100 text-200 font-semibold uppercase tracking-widest text-primary">Explore. Connect. Collect.</p><h2 id="challenges-title" className="font-heading text-hero-700 font-bold">Your challenge checklist</h2></div>
              <span className="shrink-0 rounded-full bg-secondary px-300 py-200 text-200 text-secondary-foreground">1 challenge = 1 point</span>
            </div>
            <p className="mb-500 text-300 text-muted-foreground">Pick any order. Add a short note. Make it your own.</p>
            <div role="group" aria-label="Filter challenges" className="mb-600 flex flex-wrap gap-200">
              {(['All challenges', 'To do', 'Completed'] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={cn('rounded-full border px-400 py-200 font-medium text-[length:var(--text-300)] transition-colors', filter === value ? 'border-foreground bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-muted')}>{value}{value === 'Completed' && ready ? ` (${done})` : ''}</button>)}
            </div>
            {visible.length === 0 && ready && <EmptyState title={filter === 'Completed' ? 'Your story starts here' : 'You did it. All ten!'} hint={filter === 'Completed' ? 'Complete your first challenge and it will appear here.' : 'Keep the conversations going. The best connections last beyond the conference.'} />}
            <div className="grid gap-400 md:grid-cols-2">
              {visible.map((challenge) => {
                const index = challenges.indexOf(challenge);
                const completion = mine.find((entry) => entry.challengeId === challenge.id);
                const Icon = categoryIcon[challenge.category];
                return (
                  <article key={challenge.id} className={cn('flex flex-col rounded-2xl border bg-card p-500 transition-colors', completion && 'border-success/40')}>
                    <div className="mb-500 flex items-center justify-between">
                      <span className={cn('inline-flex items-center gap-200 rounded-lg px-300 py-200 text-[length:var(--text-200)] font-medium', categoryStyle[challenge.category])}><Icon className="icon-size-200" />{challenge.category}</span>
                      <span className="font-numeric text-200 text-muted-foreground">{String(index + 1).padStart(2, '0')} / 10</span>
                    </div>
                    <h3 className="font-heading text-500 font-semibold">{challenge.title}</h3>
                    <p className="mb-500 mt-200 flex-1 text-300 leading-300 text-muted-foreground">{challenge.description}</p>
                    {completion && <blockquote className="mb-400 break-words border-l-2 border-success/40 pl-300 text-300 italic text-muted-foreground">{completion.note}</blockquote>}
                    <button type="button" disabled={!ready || crud.pending || !ownerId} onClick={() => { setSelected(challenge); setNotice(''); }} className={cn('flex w-full items-center justify-between rounded-xl border px-300 py-300 text-[length:var(--text-300)] font-medium transition-colors', completion ? 'border-success/25 bg-success-soft text-success hover:bg-success/15' : 'hover:border-primary/40 hover:bg-accent hover:text-accent-foreground')} aria-label={`${completion ? 'Edit' : 'Complete'} ${challenge.title}`}>
                      <span className="flex items-center gap-200">{completion ? <CheckCheck className="icon-size-200" /> : <Plus className="icon-size-200" />}{completion ? 'Completed' : 'Mark as done'}</span>{completion ? <span className="text-200">Edit note</span> : <ArrowRight className="icon-size-200" />}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-500">
            <section id="leaderboard" aria-labelledby="leaderboard-title" className="scroll-mt-600 overflow-hidden rounded-2xl border bg-card">
              <div className="border-b p-500"><div className="flex items-center justify-between"><span className="rounded-xl bg-gold p-300 text-gold-foreground"><Trophy className="icon-size-400" /></span><button type="button" onClick={() => void crud.refresh()} disabled={crud.pending || crud.status === 'loading' || !!selected} aria-label="Refresh leaderboard" className="rounded-lg p-200 text-muted-foreground hover:bg-muted"><RefreshCw className={cn('icon-size-200', crud.status === 'loading' && 'animate-spin')} /></button></div><h2 id="leaderboard-title" className="mt-400 font-heading text-600 font-bold">The leaderboard</h2><p className="mt-100 text-300 text-muted-foreground">A little friendly competition.</p></div>
              {crud.status === 'loading' ? <LoadingState /> : crud.status === 'error' ? <p className="p-500 text-300 text-muted-foreground">Leaderboard unavailable. Use Try again to reconnect.</p> : players.length === 0 ? <div className="p-500"><EmptyState title="First explorer, step up!" hint="Finish a challenge to put your name on the board." /></div> : <ol className="divide-y">
                {players.map((player) => <li key={player.id} className={cn('flex items-center gap-300 px-500 py-400', player.id === ownerId && 'bg-accent/50')}><span className={cn('flex h-800 w-800 shrink-0 items-center justify-center rounded-full font-numeric text-[length:var(--text-300)] font-semibold', player.rank === 1 ? 'bg-gold text-gold-foreground' : 'bg-muted text-muted-foreground')}>{player.rank === 1 ? <Trophy className="icon-size-200" /> : player.rank}</span><div className="min-w-0 flex-1"><p className="break-words text-300 font-semibold">{player.name}{player.id === ownerId && <span className="ml-200 text-200 font-normal text-primary">(you)</span>}</p><p className="text-200 text-muted-foreground">{player.score} of 10 adventures</p></div><span className="font-numeric text-500 font-semibold">{player.score}<span className="ml-100 text-200 font-normal text-muted-foreground">pt{player.score !== 1 ? 's' : ''}</span></span></li>)}
              </ol>}
              <div className="border-t bg-muted/40 px-500 py-300 text-200 text-muted-foreground">Equal points share a rank. Refresh for the latest.</div>
            </section>
            <section className="rounded-2xl border border-dashed p-500">
              <Map className="mb-300 icon-size-400 text-primary" /><h2 className="font-heading text-400 font-semibold">The only rule? Join in.</h2><p className="mt-200 text-300 leading-300 text-muted-foreground">Be curious, be kind, and ask before taking a photo. Every challenge is self-reported. The real prize is who you meet along the way.</p>
            </section>
            <div className="flex items-start gap-200 px-200 text-200 leading-300 text-muted-foreground"><Users className="mt-100 icon-size-200 shrink-0" /><p>Names and completion notes are shared with signed-in attendees. Please keep personal details out of your notes.</p></div>
          </aside>
        </div>
        <footer className="mt-section flex flex-wrap items-center justify-between gap-300 border-t pt-600 text-200 text-muted-foreground"><span className="flex items-center gap-200"><Compass className="icon-size-200" />Scavenger Hunt / Conference edition</span><span>Less scrolling. More exploring.</span></footer>
      </main>
      {selected && ownerId && <CompletionDialog key={selected.id} challenge={selected} completion={selectedCompletion} initialName={mine[0]?.playerName ?? ''} pending={crud.pending} error={crud.error} onClose={() => setSelected(null)} onSave={async (playerName, note) => {
        const saved = selectedCompletion
          ? await crud.update(selectedCompletion.id, { playerName, note })
          : await crud.create({ owner_id: ownerId, completionKey: `${ownerId}:${selected.id}`, challengeId: selected.id, playerName, note });
        if (saved) { setSelected(null); setNotice(selectedCompletion ? 'Your note has been updated.' : 'Challenge completed. One more adventure in the books!'); }
      }} onRemove={async () => {
        if (selectedCompletion && await crud.remove(selectedCompletion.id)) { setSelected(null); setNotice('Completion undone. This challenge is back on your list.'); }
      }} />}
    </div>
  );
}

function CompletionDialog({ challenge, completion, initialName, pending, error, onClose, onSave, onRemove }: {
  challenge: Challenge; completion?: CompletionRecord; initialName: string; pending: boolean; error: string | null;
  onClose(): void; onSave(name: string, note: string): Promise<void>; onRemove(): Promise<void>;
}) {
  const [name, setName] = useState(completion?.playerName ?? initialName);
  const [note, setNote] = useState(completion?.note ?? '');
  const [confirming, setConfirming] = useState(false);
  const fieldStyle = 'mt-200 w-full rounded-xl border border-input bg-background px-400 py-300 text-300 placeholder:text-muted-foreground';
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-var(--spacing-800))] max-w-dialog -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-card p-600 shadow-xl" onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
          <Dialog.Close disabled={pending} aria-label="Close completion form" className="absolute right-400 top-400 rounded-full p-200 text-muted-foreground hover:bg-muted"><X className="icon-size-300" /></Dialog.Close>
          <span className="mb-500 inline-flex rounded-xl bg-accent p-300 text-accent-foreground"><Flag className="icon-size-400" /></span>
          <Dialog.Title className="pr-600 font-heading text-600 font-bold">{completion ? 'A memory worth keeping' : 'Adventure accomplished?'}</Dialog.Title>
          <Dialog.Description className="mt-200 text-300 leading-300 text-muted-foreground">{challenge.title}. Add a short note to make it official. Names and notes are visible to signed-in attendees.</Dialog.Description>
          <form onSubmit={(event) => { event.preventDefault(); if (name.trim() && note.trim() && !pending) void onSave(name.trim(), note.trim()); }} className="mt-600 space-y-400">
            <label className="block text-300 font-medium" htmlFor="player-name">Your leaderboard name<input id="player-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required disabled={pending} placeholder="What should we call you?" className={fieldStyle} /></label>
            <label className="block text-300 font-medium" htmlFor="completion-note">Your short note<textarea id="completion-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} required rows={3} disabled={pending} placeholder="Who did you meet? What did you discover?" className={`${fieldStyle} resize-y`} /></label>
            <p className="text-right text-200 text-muted-foreground">{note.length} / 240 characters</p>
            {error && <ErrorState message={error} />}
            {confirming ? <div className="rounded-xl border border-destructive/30 p-400 text-300"><p>Undo completion of <strong>{challenge.title}</strong>? Your saved note and point will be removed.</p><div className="mt-400 flex gap-300"><button type="button" disabled={pending} onClick={() => void onRemove()} className={quietButton}>Yes, undo completion</button><button type="button" disabled={pending} onClick={() => setConfirming(false)} className={quietButton}>Keep it</button></div></div> : <div className="flex flex-wrap items-center justify-between gap-300">{completion ? <button type="button" disabled={pending} onClick={() => setConfirming(true)} className="text-300 text-destructive underline underline-offset-4">Undo completion</button> : <Dialog.Close disabled={pending} className={quietButton}>Not yet</Dialog.Close>}<button type="submit" disabled={pending || !name.trim() || !note.trim()} className={primaryButton}>{pending ? 'Saving...' : completion ? 'Save note' : 'Complete challenge'}<Check className="icon-size-200" /></button></div>}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default App;
