#!/bin/bash

# Script para sincronizar datos entre MySQL principal y espejo

PRIMARY_HOST="mysql"
PRIMARY_PORT="3306"
MIRROR_HOST="mysql-mirror"
MIRROR_PORT="3306"
DB_USER="laravel_user"
DB_PASS="laravel_password"
PRIMARY_DB="laravel_db"
MIRROR_DB="laravel_db_mirror"

echo "Iniciando sincronización de bases de datos..."
echo "Origen: $PRIMARY_HOST:$PRIMARY_PORT/$PRIMARY_DB"
echo "Destino: $MIRROR_HOST:$MIRROR_PORT/$MIRROR_DB"

# Hacer dump de la base de datos principal
echo "Creando backup de la base de datos principal..."
mysqldump -h "$PRIMARY_HOST" -P "$PRIMARY_PORT" -u "$DB_USER" -p"$DB_PASS" \
    --single-transaction --quick --lock-tables=false \
    "$PRIMARY_DB" > /tmp/db_backup.sql

if [ $? -eq 0 ]; then
    echo "✓ Backup creado exitosamente"
    
    # Restaurar en la base de datos espejo
    echo "Restaurando en la base de datos espejo..."
    mysql -h "$MIRROR_HOST" -P "$MIRROR_PORT" -u "$DB_USER" -p"$DB_PASS" \
        "$MIRROR_DB" < /tmp/db_backup.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Sincronización completada exitosamente"
        rm /tmp/db_backup.sql
        exit 0
    else
        echo "✗ Error al restaurar en la base de datos espejo"
        exit 1
    fi
else
    echo "✗ Error al crear el backup"
    exit 1
fi
