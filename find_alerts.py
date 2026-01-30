
import re

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# alert
alerts = re.findall(r'alert\((.*?)\)', content)
print(f"Alerts: {len(alerts)}")
for a in alerts[:5]:
    print(f"  - alert({a})")

# confirm
confirms = re.findall(r'confirm\((.*?)\)', content)
print(f"Confirms: {len(confirms)}")
for c in confirms[:5]:
    print(f"  - confirm({c})")

# prompt
prompts = re.findall(r'prompt\((.*?)\)', content)
print(f"Prompts: {len(prompts)}")
for p in prompts[:5]:
    print(f"  - prompt({p})")
