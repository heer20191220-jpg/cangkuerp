@echo off
setlocal
cd /d "%~dp0"
if not exist backups mkdir backups
set "STAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "STAMP=%STAMP: =0%"
copy /Y "data\db.json" "backups\db_%STAMP%.json"
echo.
echo 数据已备份到 backups 目录。
pause
