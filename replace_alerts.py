
import sys

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. 成功メッセージの置換
old_succ = "alert(`「${res.data.section.name}」に参加しました！`);"
new_succ = "await Swal.fire({ icon: 'success', title: '参加しました！', text: `「${res.data.section.name}」に参加しました！` });"
if old_succ in content:
    content = content.replace(old_succ, new_succ)
    print("Replaced success message")
else:
    print("Success message not found")

# 2. 無効なコードの置換
old_inv = "alert('無効なコードです');"
new_inv = "Swal.fire({ icon: 'error', title: 'エラー', text: '無効なコードです' });"
if old_inv in content:
    content = content.replace(old_inv, new_inv)
    print("Replaced invalid code message")
else:
    print("Invalid code message not found")

# 3. 既に参加済みの置換
old_joined = "alert(e.response.data.error || '既に参加済みのクラスです');"
new_joined = "Swal.fire({ icon: 'info', title: '参加済み', text: e.response.data.error || '既に参加済みのクラスです' });"
if old_joined in content:
    content = content.replace(old_joined, new_joined)
    print("Replaced already joined message")
else:
    print("Already joined message not found")

# 4. エラー発生の置換
old_err = "alert('エラーが発生しました');"
new_err = "Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });"
if old_err in content:
    content = content.replace(old_err, new_err)
    print("Replaced generic error message")
else:
    print("Generic error message not found")

with open(file_path, 'w') as f:
    f.write(content)
