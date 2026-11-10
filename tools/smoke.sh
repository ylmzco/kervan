#!/bin/sh
# Derlenmiş oyunu gerçek tarayıcıda açar, al-sat-büyüt-banka akışını oynatır. Hata varsa sıfırdan farklı kodla çıkar.
(cd dist && python3 -m http.server 4173 >/dev/null 2>&1 &) ; sleep 1
mkdir -p shots
OUT=$(python3 tools/play.py http://localhost:4173/index.html shots 2>&1); RC=$?
pkill -f "http.server 4173"
echo "$OUT" | grep -E '"cash"|ERRORS|Error|waiting' | cut -c1-200
[ $RC -eq 0 ] && ! echo "$OUT" | grep -q "PAGEERR\|is not defined\|Cannot read"
