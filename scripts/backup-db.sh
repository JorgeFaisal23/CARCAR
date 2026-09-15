#!/bin/sh
set -e

# ==============================================================================
# Script de Respaldo Automatizado Diario de PostgreSQL
# ==============================================================================

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/rentacore_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Iniciando respaldo de la base de datos..."

# Generar dump y comprimir
pg_dump -h db -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Respaldo generado con éxito: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Mantener solo los últimos 14 días de respaldos locales
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +14 -delete
echo "[$(date)] Limpieza de respaldos anteriores a 14 días completada."
