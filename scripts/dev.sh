#!/bin/bash

# 启动 API 服务
cd api
npm run dev &
API_PID=$!

# 启动扩展开发服务器
cd ../extension
npm run dev &
EXTENSION_PID=$!

# 等待用户按下 Ctrl+C
trap "kill $API_PID $EXTENSION_PID" EXIT
wait 