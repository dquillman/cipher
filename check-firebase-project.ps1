Write-Host ""
Write-Host "===== FIREBASE PROJECT CHECK =====" -ForegroundColor Cyan
Write-Host ""

Write-Host "1) Active Firebase Project:"
firebase use

Write-Host ""
Write-Host "2) All Firebase Projects You Have Access To:"
firebase projects:list

Write-Host ""
Write-Host "3) Hosting Targets Configured:"
firebase target

Write-Host ""
Write-Host "4) .firebaserc Contents:"
Get-Content .firebaserc

Write-Host ""
Write-Host "===== DONE =====" -ForegroundColor Cyan
Write-Host ""
