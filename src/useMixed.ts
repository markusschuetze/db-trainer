import { useMemo, useState } from 'react';
import { mixedOrder } from './logic/order';

/** Aufgabenfolge in gemischter Reihenfolge; nach dem Durchlauf wird neu gemischt. */
export function useMixed<T>(items: T[], key: (t: T) => string) {
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0);
  const [prevLast, setPrevLast] = useState<string | undefined>(undefined);
  const order = useMemo(() => mixedOrder(items, key, prevLast), [items, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const item = items[order[pos]];
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
