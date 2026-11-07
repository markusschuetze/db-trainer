# Erzeugt Wissensfragen als JSON-Dateien in src/content/aufgaben/fragen/ aus kompakten Eintraegen.
# Aufruf: python3 scripts/content/gen.py <datei.py> <ausgabe.json>
# Eintrag: (id, topicId, frage, [optionen], [richtige indizes], erklaerung)
import json, re, sys, importlib.util
topics = open('src/content/topics.ts').read()
chapter_of = {m.group(1): m.group(2) for m in re.finditer(r"\{ id: '([^']+)', chapter: '([^']+)'", topics)}
spec = importlib.util.spec_from_file_location('q', sys.argv[1]); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
import glob
existing = set(re.findall(r"id: '([^']+)',\n\s+topicId", open('src/content/mcQuestions.ts').read()))
for f in glob.glob('src/content/aufgaben/fragen/*.json'):
    if f != sys.argv[2]:
        d = json.load(open(f))
        existing |= {q['id'] for q in (d if isinstance(d, list) else [d])}
out = []
for (i, t, q, opts, correct, why) in mod.Q:
    assert i not in existing, f'ID doppelt: {i}'
    existing.add(i)
    assert t in chapter_of, f'Thema unbekannt: {t}'
    assert all(0 <= c < len(opts) for c in correct) and len(set(opts)) == len(opts), i
    # Antworten deterministisch mischen (sonst stuende die richtige Antwort immer vorn)
    import random
    rnd = random.Random(i)
    order = list(range(len(opts)))
    rnd.shuffle(order)
    opts = [opts[k] for k in order]
    correct = sorted(order.index(c) for c in correct)
    d = {'id': i, 'topicId': t, 'chapter': chapter_of[t], 'question': q, 'options': opts, 'correct': correct, 'explanation': why}
    if len(correct) > 1: d['multi'] = True
    out.append(d)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(sys.argv[2], len(out), 'Fragen')
