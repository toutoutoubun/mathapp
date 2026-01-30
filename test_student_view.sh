#!/bin/bash

# 生徒としてログイン（username: RKZYXG, password: password）
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"RKZYXG","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token obtained: ${TOKEN:0:20}..."

# コンテンツブロックを取得
echo -e "\n=== Content Blocks for step_id=2 ==="
curl -s -X GET "http://localhost:3000/api/student/content-blocks?step_id=2" \
  -H "Authorization: Bearer $TOKEN" | jq '.blocks[] | {id, block_type, order_index}'

# 問題を取得
echo -e "\n=== Questions for step_id=2 ==="
curl -s -X GET "http://localhost:3000/api/student/questions?step_id=2" \
  -H "Authorization: Bearer $TOKEN" | jq '.questions[] | {id, question_text, order_index}'
