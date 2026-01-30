
import os

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    # 削除開始
    if "<!-- 生徒画面プレビュー -->" in line:
        skip = True
    
    # 削除終了
    # 1486行目の </script> を検出
    if skip and line.strip() == "</script>":
        # さらに念のため、次の行が </body> であることを確認...できない（イテレータなので）
        # しかし、このブロックの終わりは必ず </script> なので、
        # ここでスキップ解除して continue すればこの行は削除される
        skip = False
        continue

    if skip:
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Done.")
