import { useCallback, useEffect, useRef, useState } from 'react';

interface Identified { id: string }
interface CrudApi<T extends Identified> {
  list(): Promise<T[]>;
  create(input: Omit<T, 'id'>): Promise<T>;
  update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<Partial<T>>;
  remove(id: string): Promise<void>;
}

export function useCrud<T extends Identified>(api: CrudApi<T>) {
  const [items, setItems] = useState<readonly T[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const current = useRef<readonly T[]>([]);
  const alive = useRef(false);
  const busy = useRef(false);
  const request = useRef(0);
  const apiRef = useRef(api);

  useEffect(() => { apiRef.current = api; }, [api]);
  const commit = useCallback((next: readonly T[]) => {
    current.current = next;
    setItems(next);
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    const version = ++request.current;
    setStatus('loading');
    setError(null);
    try {
      const next = await apiRef.current.list();
      if (!alive.current || version !== request.current) return;
      commit(next);
      setStatus('ready');
    } catch (cause) {
      if (!alive.current || version !== request.current) return;
      console.error('Unable to load hunt progress', cause);
      setError('Progress could not be loaded. Check your connection and app access, then try again.');
      setStatus('error');
    }
  }, [commit]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => { alive.current = false; };
  }, [refresh]);

  const mutate = useCallback(async (
    optimistic: (rows: readonly T[]) => readonly T[],
    save: () => Promise<(rows: readonly T[]) => readonly T[]>,
  ): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    ++request.current;
    const previous = current.current;
    commit(optimistic(previous));
    setPending(true);
    setError(null);
    try {
      const reconcile = await save();
      if (!alive.current) return false;
      commit(reconcile(current.current));
      return true;
    } catch (cause) {
      if (!alive.current) return false;
      commit(previous);
      console.error('Unable to save hunt progress', cause);
      setError('Your change was not saved. Check your connection and app access, then retry. If it was completed in another tab, close this form and refresh.');
      return false;
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  }, [commit]);

  const create = useCallback((input: Omit<T, 'id'>) => {
    const optimistic = { ...input, id: `pending-${crypto.randomUUID()}` } as T;
    return mutate(
      (rows) => [...rows, optimistic],
      async () => {
        const saved = await apiRef.current.create(input);
        return (rows) => rows.map((row) => row.id === optimistic.id ? saved : row);
      },
    );
  }, [mutate]);

  const update = useCallback((id: string, patch: Partial<Omit<T, 'id'>>) => mutate(
    (rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row),
    async () => {
      const saved = await apiRef.current.update(id, patch);
      return (rows) => rows.map((row) => row.id === id ? { ...row, ...saved } : row);
    },
  ), [mutate]);

  const remove = useCallback((id: string) => mutate(
    (rows) => rows.filter((row) => row.id !== id),
    async () => {
      await apiRef.current.remove(id);
      return (rows) => rows;
    },
  ), [mutate]);

  return { items, status, error, pending, create, update, remove, refresh };
}
