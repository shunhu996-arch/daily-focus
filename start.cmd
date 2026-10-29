@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 研途 · 本地学习站
where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo 没有找到 Python。请先安装 Python 3，或直接双击 index.html 使用。
  echo.
  pause
  exit /b
)
echo 正在启动研途：http://127.0.0.1:5180/
start "" /b python -m http.server 5180 --bind 127.0.0.1
timeout /t 2 >nul
start "" "http://127.0.0.1:5180/"
echo.
echo 服务已启动。不要关闭这个窗口；关闭窗口后本地网站会停止。
echo 数据只保存在浏览器里，记得每周导出一次备份。
echo.
pause
