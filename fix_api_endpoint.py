
import os

file_path = '/home/user/webapp/src/index.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # テンプレートリテラルの置換
    if 'axios.get(`/api/teacher/questions?step_id=${stepId}`)' in line:
        line = line.replace('/api/teacher/questions', '/api/teacher/step-questions')
    # エスケープされている場合も考慮 (\` ... \`)
    if 'axios.get(\`/api/teacher/questions?step_id=\${stepId}\`)' in line:
        line = line.replace('/api/teacher/questions', '/api/teacher/step-questions')
        
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Done.")
