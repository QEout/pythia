import sqlite3, json

conn = sqlite3.connect('pythia.db')
conn.row_factory = sqlite3.Row

print("=== Consensus Predictions (all rounds) ===\n")
rows = conn.execute("SELECT round_id, ts, predictions FROM consensus ORDER BY ts DESC").fetchall()
for r in rows:
    print(f"--- Round {r['round_id']} [{r['ts']}] ---")
    try:
        preds = json.loads(r['predictions'])
        for i, p in enumerate(preds):
            tag = p.get('type', 'consensus')
            print(f"  [{tag}] conf={p.get('confidence', '?')} | {p.get('prediction', p.get('text', ''))[:120]}")
    except:
        print(f"  (parse error)")
    print()

conn.close()
