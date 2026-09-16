# Guía Rápida: Cómo Conectarte a tu Servidor Ubuntu y Actualizar la App

Esta guía te explica paso a paso cómo volver a entrar a tu VPS en cualquier momento desde Windows y cómo actualizar la aplicación cuando haya cambios en el código.

---

## 1. Cómo volver a abrir la terminal de tu Servidor (SSH)

Cada vez que cierres tu terminal o apagues tu computadora, para volver a entrar a tu VPS:

1. Presiona la tecla `Windows`, escribe **PowerShell** (o **Terminal**) y ábrelo.
2. Ejecuta el comando de conexión `ssh` indicando la ruta de tu llave privada descargada y la IP pública de tu VPS:

```powershell
ssh -i "C:\Users\xenon\Downloads\tu-archivo-de-clave.key" ubuntu@TU_IP_PUBLICA
```

> [!TIP]
> **Atajo rápido opcional:**  
> Puedes crear un archivo en tu escritorio llamado `conectar.bat` que contenga exactamente esa línea. Así, cada vez que le des doble clic, se abrirá la terminal conectada a tu servidor automáticamente.

---

## 2. Cómo actualizar la Aplicación con los últimos cambios

Una vez dentro de la terminal de Ubuntu (verás `ubuntu@rentacore:~$`):

### Paso A: Entrar a la carpeta del proyecto
```bash
cd ~/app
```

### Paso B: Descargar los últimos cambios desde GitHub
```bash
git pull origin main
```

### Paso C: Reconstruir y actualizar el contenedor
Para actualizar únicamente el servicio web de Next.js (rápido):
```bash
sudo docker compose up -d --build web
```

O si hubo cambios en la base de datos, proxies o configuración general:
```bash
sudo docker compose up -d --build
```

---

## 3. Comandos útiles del día a día

* **Ver el estado de los contenedores:**
  ```bash
  sudo docker compose ps
  ```

* **Ver los registros (logs) en tiempo real para diagnosticar errores:**
  ```bash
  sudo docker compose logs -f web
  ```
  *(Presiona `Ctrl + C` para salir de los logs).*

* **Reiniciar los servicios:**
  ```bash
  sudo docker compose restart
  ```

* **Cerrar la sesión SSH del servidor:**
  ```bash
  exit
  ```
