#!/bin/bash
set -e

echo "Esperando a MySQL..."
sleep 15

echo "Ejecutando migraciones..."
php artisan migrate --force

echo "Iniciando servidor..."
php artisan serve --host=0.0.0.0 --port=8000
