import fitz, sys
sys.stdout.reconfigure(encoding="utf-8")
d = fitz.open(sys.argv[1])
print("pages", len(d))
out = []
for i, p in enumerate(d):
    out.append(f"=== {i+1} ===\n" + p.get_text())
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out))
