#!/bin/sh
set -e

# ==============================================================================
# Script de Entrada para Contenedor de Producción Next.js + Prisma
# ==============================================================================

echo "========================================================="
echo "  RentaCore / CARCAR - Iniciando Contenedor de Producción"
echo "========================================================="

# Si el comando a ejecutar es el servidor principal (node server.js),
# asegurar que las migraciones de base de datos estén al día antes de arrancar.
if [ "$1" = "node" ] && [ "$2" = "server.js" ]; then
  echo "[entrypoint] Ejecutando migraciones pendientes en PostgreSQL..."
  npx prisma migrate deploy
  echo "[entrypoint] Migraciones completadas exitosamente."
fi

# Ejecutar el comando especificado
exec "$@"
