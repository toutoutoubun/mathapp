
import os

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    # 1. API削除
    if "app.get('/api/teacher/preview-content'" in line:
        skip = True
    
    # 2. Route削除
    if "app.get('/teacher/preview'" in line:
        skip = True
        
    # Skip終了判定
    if skip and line.strip() == "});":
        skip = False
        continue
    # Route定義の終了判定で }) だけでなく `})` も考慮（インデントなしの場合）
    # API定義の終了判定も同様。
    # app.get(...) は `})` で終わるはず。
    
    if skip:
        continue

    # 3. Dashboard Card削除 (teacher/preview card)
    if '<a href="/teacher/preview"' in line and 'bg-gradient-to-br from-green-100' in line:
        skip = True
        continue
    
    # Card削除の終了判定
    if skip and '</a>' in line:
        skip = False
        continue

    # 4. 各管理画面のナビゲーションバーのリンク削除
    # <a href="/teacher/preview" class="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition text-sm">
    if '<a href="/teacher/preview"' in line and 'bg-green-500' in line:
        continue
    
    # また、bg-green-400 (hover) もあるかもしれないので、単純にhrefで判定し、かつnav内と思われるものを削除
    # しかし、誤爆が怖いので、具体的なクラス名の一部で判定
    if '<a href="/teacher/preview"' in line and '生徒画面' in line:
        continue
    if '<a href="/teacher/preview"' in line and 'プレビュー' in line:
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Done.")
