# Pendientes — AutoControl

Última sesión de pruebas: 20/10/2026. Probado en web (Expo web + Chrome) y, en parte, en Android (emulador Pixel 8).

## Ya arreglado en la sesión del 20/10

- Migración `20261008_payments_plan_tracking.sql` aplicada (faltaba la tabla `subscription_payments` → 500 al activar la suscripción).
- Carpeta `frontend/android` regenerada con `npx expo prebuild --platform android` (estaba desincronizada de `app.json`: paquete `com.anonymous.carmaintenanceapp`, sin plugin de Stripe → pantalla en blanco en Android y error "Activity class does not exist").
- `frontend/android/gradlew.bat` sustituido por la versión antigua: la plantilla nueva de Expo añade `-classpath "%CLASSPATH%"` vacío y falla en Windows. **Si se vuelve a hacer `prebuild`, hay que volver a quitar ese `-classpath "%CLASSPATH%"`.**
- Instalado `expo-system-ui` (para que `userInterfaceStyle: dark` se aplique en nativo).

## Tareas fuera del código (Franco)

- [ ] Poner una `CLAUDE_API_KEY` válida en `backend/.env` (la actual da `401 invalid x-api-key`).
- [ ] Borrar `frontend/android_backup` (copia de la carpeta android antigua).
- [ ] Actualizar `expo` a la versión que pide el SDK (`npx expo install --check`; tenía 54.0.34, pide ~54.0.37).

## Nueva funcionalidad

- [ ] **Dashboard distinto para gestor y cliente.** Ahora el gestor ve el mismo Inicio que el cliente con dos opciones más (Solicitudes, Usuarios). El gestor debería tener su propio panel (solicitudes pendientes, usuarios, resumen) separado del de cliente.

## Bugs (por prioridad)

1. [ ] **En la web no se ve ningún aviso.** `Alert.alert` de React Native no hace nada en web: no salen errores (400/409/500), ni confirmaciones ("solicitud enviada"), ni la validación de km. En Android sí funciona. Solución: un helper común (`showAlert` / `confirm`) que use `window.alert`/`window.confirm` en web, o mensajes dentro de la pantalla como en Login/Registro.
2. [ ] **Faltan confirmaciones.** Borrar un coche (`MyCarsScreen.js`, `handleDelete`) envía la solicitud con un solo toque, también en móvil. Aprobar/rechazar solicitudes tampoco pide confirmación.
3. [ ] **Los mantenimientos añadidos con "Añadir" no cuentan para el plan.** El plan (`getAlertasByCar` → `Maintenance.findLatestPlanRecords`) solo mira registros con `plan_operacion` (los de "Registrar como hecho"). Ejemplo: VW Golf 1234TST tiene "Cambio de Aceite" a 33.000 km y el plan dice "Aceite motor + filtro – sin registros en la app". Hay que vincular los tipos de mantenimiento con las operaciones del plan (o unificar los dos formularios).
4. [ ] **Las operaciones solo por tiempo nunca avisan.** `maintenancePlanController.js`, `getAlertasByCar`: `WHERE cada_km IS NOT NULL` deja fuera "Líquido frenos – cada 24 meses". Además, sin registros previos no hay ningún aviso por fecha: usar como base la fecha de alta del coche o el año de matriculación.
5. [ ] **Textos.**
   - Mensajes en inglés en `authController.js`: "Password must be at least 8 characters…", "Invalid email or password", "User already exists", "Server error during registration/login". También en `carController.js` ("Car not found", "Server error…").
   - Voseo en Solicitudes: "Aprobá o rechazá los pedidos de tus clientes" → "Aprueba o rechaza…".
   - Falta tilde: "Preguntale al asistente" → "Pregúntale".
6. [ ] **Error del asistente poco útil.** Si la API de Claude falla (clave inválida, sin saldo), la app solo dice "Error al consultar el asistente". Distinguir 401/402/429 y mostrar un mensaje claro.
7. [ ] **Gestor.**
   - Rechazar no permite escribir un motivo.
   - Un gestor puede aprobar sus propias solicitudes.
   - En el historial de solicitudes sale el nombre actual del usuario, no el que tenía al pedir el cambio.
   - No se puede quitar el rol de gestor desde la app.
8. [ ] **Detalles.**
   - Al añadir coche, en "Motor" se guarda el texto de relleno "Motorización OEM según versión".
   - Marcas duplicadas: "Mercedes" y "Mercedes-Benz".
   - Opel Astra solo tiene la versión "Base" (faltan datos de versiones).
   - En "Registrar servicio" el km viene vacío (placeholder "45500"); debería traer los km actuales del coche.
   - El taller introducido no se muestra en el historial.
9. [ ] **Decisión pendiente:** la matrícula es única entre *todos* los usuarios (`ER_DUP_ENTRY` → 409 "Ya existe un vehículo con esa matrícula"). Si otro usuario ya la registró, no se puede añadir, y el error revela que ese coche existe en la app. ¿Única por usuario o global?

## Pruebas que faltan

- [ ] Android: registro, pago nativo de Stripe (PaymentSheet), añadir coche, actualizar km, guardar mantenimiento, plan completo, ficha técnica, perfil, ajustes, usuarios, aprobar/rechazar, cerrar sesión.
  - Para que Claude pueda escribir en el emulador: Android Studio → File → Settings → Tools → Emulator → desmarcar "Launch in the Running Devices tool window", y relanzar el emulador (se abre en ventana propia).
  - Los emuladores actuales son Android 17 (API 37, vista previa) y dan errores de sistema en bucle; conviene crear uno con API 35 o 36.
- [ ] Asistente de Claude (cuando haya clave válida).

## Datos de prueba creados el 20/10

- Usuario `tester.claude+1@autocontrol.test` (ahora **gestor**), con coche Opel Astra 9876ZZQ, un registro de aceite a 91.000 km y dos solicitudes (una aprobada, una rechazada).
- Dos pagos de prueba de 16,49 € en Stripe (modo test); el primero no activó nada por el 500.
