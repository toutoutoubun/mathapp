
import os

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# 修正対象のルートパス
target_routes = ['/student/login', '/register']
current_route = None

new_lines = []
for i, line in enumerate(lines):
    # ルート定義の開始を検出
    if "app.get('/student/login'" in line:
        current_route = '/student/login'
    elif "app.get('/register'" in line:
        current_route = '/register'
    elif "app.get(" in line:
        # 他のルートに入ったらリセット（ただしネストは考慮せず単純に）
        # 行の内容で判断するのは危険だが、今回は簡易的に
        if "app.get('/" in line and not ("student/login" in line or "register" in line):
             current_route = None

    new_lines.append(line)

    # 現在のルートが修正対象の場合、</head>の直前にaxiosを追加
    # ただし、すでにaxiosがある場合は追加しない
    if current_route and "</head>" in line:
        # 直前の行などをチェックして重複防止
        has_axios = False
        for j in range(max(0, i-5), i):
            if "axios.min.js" in lines[j]:
                has_axios = True
                break
        
        if not has_axios:
            # </head> の行を置き換えるのではなく、その前に挿入したい
            # appendしたばかりの `</head>` を取り消して、挿入してから再度append
            new_lines.pop() 
            new_lines.append('        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>\n')
            new_lines.append(line) # </head>
            print(f"Added axios to {current_route}")
            current_route = None # 1ルートにつき1回のみ

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Done.")
