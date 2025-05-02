@echo off
echo This will remove the local Node.js installation and dependencies.
echo Your text data will remain untouched.
echo.
echo Press Ctrl+C to cancel, or...
pause

echo.
echo Removing local Node.js installation...
if exist nodejs (
    rmdir /s /q nodejs
    echo Local Node.js removed.
) else (
    echo No local Node.js installation found.
)

echo.
echo Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules removed.
) else (
    echo No node_modules folder found.
)

echo.
echo Removing .npmrc...
if exist .npmrc (
    del .npmrc
    echo .npmrc removed.
)

echo.
echo Cleanup complete. To set up the application again, run download_nodejs.bat
echo.
pause 