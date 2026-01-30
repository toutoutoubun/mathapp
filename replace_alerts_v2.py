
import re

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. alertの置換 (単純な関数呼び出し)
# alert('...') -> Swal.fire({ icon: 'info', text: '...' })
# 文末のセミコロンの有無などを考慮し、alert(...) の部分だけを置換
def replace_alert(match):
    msg = match.group(1)
    return f"Swal.fire({{ icon: 'info', text: {msg} }})"

# navigator.clipboard...alert は別処理するので、それ以外
# 行頭やブロック内での alert(...)
# onclick="..." 内での alert もある

# 4. onclick="...alert(...)..." のようなパターン (navigator.clipboard)
# navigator.clipboard.writeText('${section.access_code}');alert('コードをコピーしました')
def replace_clipboard_alert(match):
    pre = match.group(1) # navigator.clipboard.writeText(...)
    msg = match.group(2) # 'コードをコピーしました'
    return f"{pre}.then(() => Swal.fire({{ icon: 'success', title: '完了', text: {msg}, timer: 1500, showConfirmButton: false }}))"

content = re.sub(r"(navigator\.clipboard\.writeText\([^)]+\));alert\((.*?)\)", replace_clipboard_alert, content)

# 通常の alert
content = re.sub(r"(?<!\.)alert\((['\"].*?['\"])\)", replace_alert, content)


# 2. confirmの置換
# if (!confirm('...')) return; -> 
# const { isConfirmed } = await Swal.fire({ ... }); if (!isConfirmed) return;
def replace_confirm(match):
    msg = match.group(1)
    return f"""const {{ isConfirmed }} = await Swal.fire({{
        icon: 'warning',
        title: '確認',
        text: {msg},
        showCancelButton: true,
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ'
    }});
    if (!isConfirmed)"""

content = re.sub(r"if\s*\(!confirm\((.*?)\)\)", replace_confirm, content, flags=re.DOTALL)


# 3. promptの置換
# const newTitle = prompt('ステップのタイトルを編集:', step.title);
def replace_prompt(match):
    var_name = match.group(1)
    args = match.group(2)
    parts = args.split(',', 1)
    title = parts[0].strip()
    default_val = parts[1].strip() if len(parts) > 1 else "''"
    
    return f"""const {{ value: {var_name} }} = await Swal.fire({{
        title: {title},
        input: 'text',
        inputValue: {default_val},
        showCancelButton: true
    }});"""

content = re.sub(r"const\s+(\w+)\s*=\s*prompt\((.*?)\);", replace_prompt, content)

# promptの戻り値チェックの修正
# if (newTitle === null) return;
content = re.sub(r"if\s*\((.*?)\s*===\s*null\)", r"if (\1 === undefined || \1 === null)", content)

# 5. window.checkShortAnswer 内の alert
# ここは await を使えない（呼び出し元がonclickで同期）可能性があるが、
# Swal.fire は Promise を返すが、await しなくてもダイアログは出る。
# ただ、alert はブロッキングだが Swal はノンブロッキング。
# 処理の流れが変わる可能性があるが、今回は「正解」「不正解」を出すだけなので問題ないはず。

with open(file_path, 'w') as f:
    f.write(content)

print("Done.")
