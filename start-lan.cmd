@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 研途 · 局域网访问
where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo 没有找到 Python。请先安装 Python 3。
  echo.
  pause
  exit /b
)
echo.
echo 研途将允许同一 Wi-Fi 下的手机 / 平板访问。
echo.
echo 1. 保持这个窗口打开。
echo 2. 在电脑上另开一个命令窗口，运行：ipconfig
echo 3. 找到“IPv4 地址”，例如 192.168.1.23
echo 4. 手机 / 平板浏览器打开：http://192.168.1.23:5181/
echo.
echo 如果手机打不开，请在 Windows 防火墙中允许 Python 访问“专用网络”。
echo 电脑本机仍可用：http://127.0.0.1:5181/
echo.
start "" /b python -m http.server 5181 --bind 0.0.0.0
timeout /t 2 >nul
start "" "http://127.0.0.1:5181/"
echo 服务已启动。不要关闭这个窗口。
echo 注意：手机和电脑的数据各自保存在各自浏览器里，不会自动同步。
echo.
pause

