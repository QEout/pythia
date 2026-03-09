import sqlite3
import json

conn = sqlite3.connect('pythia.db')
conn.row_factory = sqlite3.Row

tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("=== Tables ===")
for t in tables:
    print(f"  {t[0]}")

print("\n=== Recent Predictions ===")
try:
    rows = conn.execute("SELECT id, ts, domain, agent_name, prediction, confidence, verified, verify_note FROM predictions ORDER BY ts DESC LIMIT 30").fetchall()
    for r in rows:
        v = r['verified']
        status = 'HIT' if v == 1 else ('MISS' if v == 0 else 'PENDING')
        print(f"  #{r['id']:3d} [{r['ts']}] {r['domain']:12s} | {r['agent_name']:15s} | conf={r['confidence']:.2f} | {status:7s} | {r['prediction'][:80]}")
    print(f"\n  Total: {len(rows)} predictions shown")
except Exception as e:
    print(f"  Error: {e}")

print("\n=== Verification Stats ===")
try:
    total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    verified = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified IS NOT NULL").fetchone()[0]
    hits = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified = 1").fetchone()[0]
    misses = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified = 0").fetchone()[0]
    pending = total - verified
    print(f"  Total predictions: {total}")
    print(f"  Verified: {verified} (hits={hits}, misses={misses})")
    print(f"  Pending: {pending}")
    if verified > 0:
        print(f"  Accuracy: {hits/verified*100:.1f}%")
except Exception as e:
    print(f"  Error: {e}")

print("\n=== Agent Scores ===")
try:
    rows = conn.execute("SELECT * FROM agent_scores ORDER BY accuracy DESC").fetchall()
    for r in rows:
        print(f"  {r['agent_name']:15s} | total={r['total']:3d} | hits={r['hits']:3d} | accuracy={r['accuracy']:.1%}")
except Exception as e:
    print(f"  Error: {e}")

print("\n=== Consensus Rounds ===")
try:
    rows = conn.execute("SELECT round_id, ts FROM consensus ORDER BY ts DESC LIMIT 10").fetchall()
    for r in rows:
        print(f"  {r['round_id']} [{r['ts']}]")
    print(f"  Total rounds: {conn.execute('SELECT COUNT(*) FROM consensus').fetchone()[0]}")
except Exception as e:
    print(f"  Error: {e}")

conn.close()
