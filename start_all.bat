@echo off
echo Starting all services...

start cmd /k "cd api_Gateway && npm start"
start cmd /k "cd patient_service && npm start"
start cmd /k "cd doctor_service && npm start"
start cmd /k "cd consultation_service && npm start"
start cmd /k "cd medical_record_service && npm start"

echo All services started in separate terminals!
pause