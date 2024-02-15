@echo off
call pm2 stop 0
call certbot renew 
call pm2 restart 0
echo Done. Press any key to exit...
pause