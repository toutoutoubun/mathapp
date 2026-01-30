
import re

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. 変数を使った alert の置換
# alert(msg); -> Swal.fire({ icon: 'info', title: '通知', text: msg });
# ただし、msg が関数呼び出しの結果などの場合もあるので、括弧のバランスを取るのは難しい。
# 単純な変数名 `alert(msg)` や `alert(e.message)` などを狙う。
content = re.sub(r"alert\(([a-zA-Z0-9_.]+)\);", r"Swal.fire({ icon: 'info', title: '通知', text: \1 });", content)

# 2. 「生徒コードを発行しました」の alert
if "alert('生徒コードを発行しました" in content:
    target_str = "alert('生徒コードを発行しました！\\\\n\\\\n生徒コード: ' + res.data.username + '\\\\n初期パスワード: ' + res.data.password + '\\\\n\\\\nこの情報を控えて生徒に伝えてください。');"
    replace_str = """Swal.fire({
        icon: 'success',
        title: '生徒コード発行完了',
        html: '<div class="text-left">生徒コード: <b>' + res.data.username + '</b><br>初期パスワード: <b>' + res.data.password + '</b><br><br><span class="text-sm text-gray-500">この情報を控えて生徒に伝えてください。</span></div>'
    });"""
    content = content.replace(target_str, replace_str)

# 3. モジュール完了時の遷移
# 正規表現でスペースなどを柔軟にマッチさせる
content = re.sub(
    r"Swal\.fire\(\{ icon: 'info', text: 'モジュール完了！' \}\);\s*window\.location\.href\s*=\s*'/student';",
    r"Swal.fire({ icon: 'success', title: 'モジュール完了！', text: 'お疲れ様でした。' }).then(() => { window.location.href = '/student'; });",
    content
)

# 4. 「返信内容を入力してください」
content = re.sub(
    r"return alert\('返信内容を入力してください'\);",
    r"{ Swal.fire({ icon: 'warning', text: '返信内容を入力してください' }); return; }",
    content
)

# 5. その他残っている alert
content = re.sub(r"alert\('フェーズが特定できません'\);", r"Swal.fire({ icon: 'error', text: 'フェーズが特定できません' });", content)
content = re.sub(r"alert\('モジュールが特定できません'\);", r"Swal.fire({ icon: 'error', text: 'モジュールが特定できません' });", content)
content = re.sub(
    r"alert\('削除機能は今後実装予定です（ID: ' \+ id \+ '）'\);",
    r"Swal.fire({ icon: 'info', text: '削除機能は今後実装予定です（ID: ' + id + '）' });",
    content
)

# 6. 「完了 <i class="fas fa-check ml-2"></i>」の部分で、
# loadStepContent の最後の else ブロックでのアラート
# else { alert('モジュール完了！'); window.location.href = '/student'; }
# 以前の置換で Swal.fire になっていたが、もしなっていなかった場合のために
content = re.sub(
    r"alert\('モジュール完了！'\);\s*window\.location\.href\s*=\s*'/student';",
    r"Swal.fire({ icon: 'success', title: 'モジュール完了！', text: 'お疲れ様でした。' }).then(() => { window.location.href = '/student'; });",
    content
)

with open(file_path, 'w') as f:
    f.write(content)

print("Done.")
