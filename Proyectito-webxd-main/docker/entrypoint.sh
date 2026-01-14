#!/bin/sh
set -e

# Esperar a que MySQL esté listo
echo "Esperando a MySQL..."
while ! mysqladmin ping -h"$DB_HOST" --silent; do
    sleep 1
done
echo "MySQL está listo!"

# Crear directorios necesarios
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/storage/framework/{cache,sessions,views}
mkdir -p /var/www/html/bootstrap/cache

# Configurar permisos
chown -R www-data:www-data /var/www/html/storage
chown -R www-data:www-data /var/www/html/bootstrap/cache

# Generar key si no existe
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Cachear configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force

exec "$@"
