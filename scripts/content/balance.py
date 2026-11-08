"""Gleicht Antwortlängen an: ersetzt nur falsche Optionen (Index -> neuer Text). Richtige Antwort bleibt unangetastet."""
import json, glob, sys

def apply(patches):
    done = set()
    for f in glob.glob('src/content/aufgaben/fragen/*.json'):
        raw = json.load(open(f)); items = raw if isinstance(raw, list) else [raw]
        ch = False
        for q in items:
            p = patches.get(q['id'])
            if not p: continue
            for i, txt in p.items():
                assert int(i) not in q['correct'], (q['id'], i)
                q['options'][int(i)] = txt
            done.add(q['id']); ch = True
        if ch: json.dump(raw, open(f, 'w'), ensure_ascii=False, indent=1); open(f, 'a').write('\n')
    miss = set(patches) - done
    assert not miss, miss
    print('angepasst', len(done))
