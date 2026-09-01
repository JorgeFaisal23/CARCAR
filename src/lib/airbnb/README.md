# Integración con Airbnb

## Estado actual: simulada

En esta demo la sincronización **no** llama a Airbnb. El botón "Sincronizar
ahora" actualiza `AirbnbConnection.lastSyncedAt` y refresca la vista con las
reservas que ya están en la base de datos. La pantalla lo dice de forma
explícita para no prometer de más durante la demostración.

## Cómo sería la integración real

Airbnb **no tiene una API pública de reservas**. Lo que sí ofrece a cualquier
anfitrión es un **enlace iCal por anuncio**:

`Airbnb → Calendario → Disponibilidad → Sincronizar calendarios → Exportar calendario`

Ese enlace (`https://www.airbnb.mx/calendar/ical/<listingId>.ics?s=<token>`) ya
se guarda en `AirbnbConnection.icalUrl`.

### Implementación pendiente

1. Descargar el `.ics` (`fetch`) y parsearlo — `node-ical` o `ical.js`.
2. Por cada `VEVENT`, hacer upsert de un `Booking` usando el `UID` del evento
   como `externalId`, con `source = AIRBNB`.
3. Marcar como `CANCELLED` las reservas locales de origen Airbnb cuyo `UID` ya
   no venga en el archivo.
4. Ejecutarlo cada hora con un cron (Vercel Cron → route handler protegido).

### Limitaciones que conviene decirle al cliente

- Es **unidireccional**: Airbnb → nuestra plataforma. Bloquear fechas aquí no
  las bloquea en Airbnb.
- Hay **retraso**: Airbnb regenera el archivo cada cierto tiempo (hasta ~1 hora).
- **No trae datos del huésped**: el `SUMMARY` suele venir como "Reserved" y el
  nombre no aparece. Para tener nombre y contacto hay que capturarlos a mano o
  usar la API de Partners, que requiere aprobación como Software Partner.
- El token del enlace es un secreto: quien lo tenga ve tu calendario.

### Qué sí se puede hacer al revés

Exportar **nuestro** calendario como `.ics` e importarlo en Airbnb, para que las
fechas ocupadas por arrendamiento largo se bloqueen en el anuncio. Es la parte
más valiosa para un arrendador con unidades mixtas y no requiere permisos
especiales.
