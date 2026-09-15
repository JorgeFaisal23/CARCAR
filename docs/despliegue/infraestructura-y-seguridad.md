# Infraestructura, Contenedores y Blindaje de Seguridad

> **Guía Detallada de Aprovisionamiento**: [`docs/despliegue/vps-deployment-guide.md`](file:///c:/Users/xenon/Desktop/CARCAR/docs/despliegue/vps-deployment-guide.md)  
> **Archivos de Configuración**: [`docker-compose.yml`](file:///c:/Users/xenon/Desktop/CARCAR/docker-compose.yml), [`Dockerfile`](file:///c:/Users/xenon/Desktop/CARCAR/Dockerfile), [`Caddyfile`](file:///c:/Users/xenon/Desktop/CARCAR/Caddyfile)  

---

## 1. Topología de Infraestructura en Producción

```mermaid
graph LR
    User[Usuarios / Inquilinos] -->|HTTPS 443 / TLS 1.3| CF[Cloudflare WAF & Proxy]
    CF -->|SSL Full Strict| Caddy[Caddy Reverse Proxy]
    
    subgraph Servidor VPS (Red Docker Interna Aislada)
        Caddy -->|HTTP 3000| Web[Next.js App Standalone]
        Web -->|Puerto 5432 Interno| DB[(PostgreSQL 16)]
        Backup[Contenedor Backup / Cron] -->|pg_dump cifrado| DB
    end
    
    Backup -->|Dumps Diarios Cifrados| S3[(Almacenamiento Secundario R2 / S3)]
```

---

## 2. Componentes de la Pila de Despliegue

### A. Reverse Proxy Caddy 2 (`caddy:2-alpine`)
- **Único punto de entrada expuesto**: Solo los puertos `80`, `443` (TCP) y `443/udp` (HTTP/3 QUIC) están abiertos al exterior.
- **TLS 1.3 Automático**: Obtención y renovación de certificados SSL mediante Let's Encrypt o ZeroSSL.
- **Cabeceras de Seguridad**: Aplica automáticamente `HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` y prevención de XSS.

### B. Aplicación Next.js Standalone (`rentacore_web`)
- **Compilación Multi-Stage en Docker**: El [`Dockerfile`](file:///c:/Users/xenon/Desktop/CARCAR/Dockerfile) compila los assets y produce una imagen minimalista con Node.js Alpine (`output: "standalone"`).
- **Ejecución sin privilegios**: Corre bajo un usuario dedicado `nextjs:nodejs` (UID 1001) para neutralizar cualquier potencial intento de evasión de contenedor.

### C. Base de Datos PostgreSQL 16 (`rentacore_db`)
- **Red Aislada**: No expone puertos hacia la interfaz pública del servidor. Solo la aplicación Next.js y el servicio de respaldos pueden comunicarse con ella a través de la red interna de Docker (`internal`).
- **Persistencia**: Volumen Docker persistente `db_data` montado en `/var/lib/postgresql/data`.

### D. Respaldos Automatizados (`backup-db.sh`)
- Genera volcados automáticos diarios mediante `pg_dump`.
- Cifra los respaldos con GPG (`AES-256`) y aplica una política de retención para eliminar volcados antiguos que excedan los 30 días.

---

## 3. Perímetro y Blindaje de Seguridad del Servidor (Hardening)

1. **Firewall UFW Estricto**:
   - Solo se permiten los puertos: `22` (SSH con cambio de puerto recomendado), `80` (HTTP) y `443` (HTTPS).
2. **Acceso SSH Blindado**:
   - Acceso exclusivo mediante llaves criptográficas `Ed25519`.
   - `PermitRootLogin no` y `PasswordAuthentication no` en la configuración de SSH.
3. **Fail2Ban Activo**:
   - Monitorea intentos reiterados de conexión fallida y banea automáticamente las IPs atacantes a nivel de `iptables`.
4. **Cloudflare WAF**:
   - Oculta la dirección IP real del servidor VPS.
   - Mitiga ataques volumétricos DDoS de capa 7 y bloquea tráfico malicioso antes de tocar el servidor.
