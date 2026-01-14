#!/bin/bash

# Script de healthcheck y failover para MySQL

PRIMARY_HOST="${DB_HOST:-mysql}"
PRIMARY_PORT="${DB_PORT:-3306}"
MIRROR_HOST="${DB_MIRROR_HOST:-mysql-mirror}"
MIRROR_PORT="${DB_MIRROR_PORT:-3306}"
DB_USER="${DB_USERNAME:-laravel_user}"
DB_PASS="${DB_PASSWORD:-laravel_password}"

# Función para verificar conexión a MySQL
check_mysql() {
    local host=$1
    local port=$2
    
    if mysql -h "$host" -P "$port" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Verificar base de datos principal
if check_mysql "$PRIMARY_HOST" "$PRIMARY_PORT"; then
    echo "✓ Base de datos principal ($PRIMARY_HOST:$PRIMARY_PORT) está disponible"
    exit 0
else
    echo "✗ Base de datos principal ($PRIMARY_HOST:$PRIMARY_PORT) no disponible"
    
    # Intentar usar la base de datos espejo
    if check_mysql "$MIRROR_HOST" "$MIRROR_PORT"; then
        echo "✓ Usando base de datos espejo ($MIRROR_HOST:$MIRROR_PORT)"
        # Actualizar variables de entorno para usar el espejo
        export DB_HOST="$MIRROR_HOST"
        export DB_PORT="$MIRROR_PORT"
        export DB_DATABASE="${DB_MIRROR_DATABASE:-laravel_db_mirror}"
        exit 0
    else
        echo "✗ Base de datos espejo ($MIRROR_HOST:$MIRROR_PORT) tampoco disponible"
        exit 1
    fi
fi
