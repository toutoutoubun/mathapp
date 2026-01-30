
import re

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# alert(...) が残っていないか確認
# 簡易的な正規表現
remaining_alerts = re.findall(r"alert\(.*?\)", content)
print(f"Remaining alerts: {len(remaining_alerts)}")
for a in remaining_alerts:
    print(f"- {a[:50]}...")

# Swal.fire の後に location がある箇所を確認
swal_locs = re.findall(r"Swal\.fire[\s\S]*?location", content)
print(f"\nSwal followed by location: {len(swal_locs)}")
# これは範囲が広すぎるので、行単位でチェックしたほうがいいかも
