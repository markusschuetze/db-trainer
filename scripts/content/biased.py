import json,glob,sys
lo,hi=int(sys.argv[1]),int(sys.argv[2])
rows=[]
for f in sorted(glob.glob('src/content/aufgaben/fragen/*.json')):
    d=json.load(open(f)); d=d if isinstance(d,list) else [d]
    for q in d:
        if len(q['correct'])!=1: continue
        o=q['options'];c=q['correct'][0];L=[len(x) for x in o];s=sorted(L)
        if L[c]==s[-1] and s[-1]-s[-2]>=6: rows.append(q)
print(len(rows))
for q in rows[lo:hi]:
    print(q['id'],'|',q['question'])
    for i,x in enumerate(q['options']): print('  ','*' if i==q['correct'][0] else ' ',i,x)
