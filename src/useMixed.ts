import { useEffect, useMemo, useState } from 'react';
import { loadSeen, touchSeen } from './logic/seen';
import { mixedOrder } from './logic/order';

const idOf = (t: unknown) => String((t as { id?: string }).id ?? '');

/** Aufgabenfolge in gemischter Reihenfolge; nach dem Durchlauf wird neu gemischt. */
export function useMixed<T>(items: T[], key: (t: T) => string) {
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0);
  const [prevLast, setPrevLast] = useState<string | undefined>(undefined);
  const order = useMemo(() => {
    const seen = loadSeen();
    return mixedOrder(items, key, prevLast, Math.random, (t) => seen.lastIndexOf(idOf(t)));
  }, [items, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const item = items[order[pos]];
  useEffect(() => {
    if (item) touchSeen(idOf(item));
  }, [item]);
  const next = () => {
    if (pos + 1 < order.length) setPos(pos + 1);
    else {
      setPrevLast(key(items[order[pos]]));
      setRound(round + 1);
      setPos(0);
    }
  };
  return { item, pos, next, total: items.length };
}
