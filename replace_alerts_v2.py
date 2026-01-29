
import sys

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. 成功メッセージ（エスケープあり）
# 注意: Python文字列としてのエスケープと、対象文字列内のエスケープを合わせる
old_succ = r"alert(\`「\${res.data.section.name}」に参加しました！\`);"
new_succ = r"await Swal.fire({ icon: 'success', title: '参加しました！', text: \`「\${res.data.section.name}」に参加しました！\` });"
content = content.replace(old_succ, new_succ)

# 2. 個別パターンの置換
replacements = [
    (r"alert('生徒アカウントでは教師用画面にログインできません。\\n生徒用ログイン画面へ移動してください。');", 
     r"Swal.fire({ icon: 'warning', title: 'アカウント間違い', text: '生徒アカウントでは教師用画面にログインできません。生徒用ログイン画面へ移動してください。' });"),
    
    (r"alert('教師アカウントでは生徒用画面にログインできません。\\n教師用ログイン画面へ移動してください。');",
     r"Swal.fire({ icon: 'warning', title: 'アカウント間違い', text: '教師アカウントでは生徒用画面にログインできません。教師用ログイン画面へ移動してください。' });"),

    (r"alert('登録しました。ログインしてください。');",
     r"Swal.fire({ icon: 'success', title: '登録完了', text: '登録しました。ログインしてください。' });"),
     
    (r"alert('セクションを更新しました！');", r"Swal.fire({ icon: 'success', title: '更新完了', text: 'セクションを更新しました！' });"),
    (r"alert('セクションを作成しました！');", r"Swal.fire({ icon: 'success', title: '作成完了', text: 'セクションを作成しました！' });"),
    (r"alert('フェーズを更新しました！');", r"Swal.fire({ icon: 'success', title: '更新完了', text: 'フェーズを更新しました！' });"),
    (r"alert('フェーズを作成しました！');", r"Swal.fire({ icon: 'success', title: '作成完了', text: 'フェーズを作成しました！' });"),
    (r"alert('モジュールを作成しました！');", r"Swal.fire({ icon: 'success', title: '作成完了', text: 'モジュールを作成しました！' });"),
    (r"alert('ステップを作成しました！');", r"Swal.fire({ icon: 'success', title: '作成完了', text: 'ステップを作成しました！' });"),
    
    (r"alert('削除しました');", r"Swal.fire({ icon: 'success', title: '削除完了', text: '削除しました' });"),
    (r"alert('更新しました');", r"Swal.fire({ icon: 'success', title: '更新完了', text: '更新しました' });"),
    (r"alert('登録しました');", r"Swal.fire({ icon: 'success', title: '登録完了', text: '登録しました' });"),
    
    (r"alert('エラーが発生しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: 'エラーが発生しました' });"),
    (r"alert('削除に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: '削除に失敗しました' });"),
    (r"alert('更新に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: '更新に失敗しました' });"),
    (r"alert('保存に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: '保存に失敗しました' });"),
    (r"alert('追加に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: '追加に失敗しました' });"),
    (r"alert('発行に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: '発行に失敗しました' });"),
    (r"alert('メモの保存に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: 'メモの保存に失敗しました' });"),
    (r"alert('設定の保存に失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: '設定の保存に失敗しました' });"),
    
    (r"alert(json.error);", r"Swal.fire({ icon: 'error', title: 'エラー', text: json.error });"),
    
    (r"alert('データの読み込みに失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: 'データの読み込みに失敗しました' });"),
    (r"alert('コンテンツの読み込みに失敗しました');", r"Swal.fire({ icon: 'error', title: 'エラー', text: 'コンテンツの読み込みに失敗しました' });"),
    
    (r"alert('まずセクションを選択してください');", r"Swal.fire({ icon: 'info', title: '確認', text: 'まずセクションを選択してください' });"),
    (r"alert('まずフェーズを選択してください');", r"Swal.fire({ icon: 'info', title: '確認', text: 'まずフェーズを選択してください' });"),
    (r"alert('まずモジュールを選択してください');", r"Swal.fire({ icon: 'info', title: '確認', text: 'まずモジュールを選択してください' });"),
    
    (r"alert('生徒コードを入力してください');", r"Swal.fire({ icon: 'warning', title: '入力エラー', text: '生徒コードを入力してください' });"),
    
    # 複合的なメッセージ
    (r"alert('生徒を追加しました！');", r"Swal.fire({ icon: 'success', title: '追加完了', text: '生徒を追加しました！' });"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(file_path, 'w') as f:
    f.write(content)
