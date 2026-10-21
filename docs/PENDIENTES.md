# Pendientes — AutoControl

Última actualización: 21/10/2026.

> **Ojo con Android:** si se vuelve a hacer `npx expo prebuild`, hay que volver a quitar `-classpath "%CLASSPATH%"` de `frontend/android/gradlew.bat` (la plantilla nueva de Expo lo deja vacío y falla en Windows).

## Nueva funcionalidad

- [ ] **Hacer una IA con Python.** Por definir: qué tiene que hacer (p. ej. predecir averías o próximos mantenimientos, recomendar operaciones, analizar el historial…), con qué datos y cómo se conecta con el backend de Node.

## Tareas fuera del código (Franco)

- [ ] Poner una `CLAUDE_API_KEY` válida en `backend/.env` (la actual da `401 invalid x-api-key`).
- [ ] Borrar `frontend/android_backup` (copia de la carpeta android antigua).
- [ ] Actualizar `expo` a la versión que pide el SDK (`npx expo install --check`; tenía 54.0.34, pide ~54.0.37).
- [ ] Rehacer en el emulador las capturas `docs/screenshots/01-inicio.png` y `06-panel-gestor.png` (ahora son de la versión web, sin barra de estado).

## Bugs (por prioridad)

1. [ ] **Los mantenimientos añadidos con "Añadir" no cuentan para el plan.** El plan (`calcularPlanCoche` → `Maintenance.findLatestPlanRecords`) solo mira registros con `plan_operacion` (los de "Registrar como hecho"). Ahora que los Avisos y el inicio usan el plan de fábrica, se nota más: registrar "Cambio de Aceite" con "Añadir" no quita el aviso de "Aceite motor + filtro". Solución: que el formulario de "Añadir" ofrezca las operaciones del plan del coche (o vincular tipos genéricos con operaciones del plan).
2. [ ] **En la web no se ven los avisos de `Alert.alert`.** Ya existe el helper `src/utils/dialogs.js` (`showMessage` / `confirmAction`) y se usa en Usuarios y en el panel del gestor. Falta usarlo en el resto de pantallas (errores 400/409/500, "solicitud enviada", validación de km…).
3. [ ] **Faltan confirmaciones.** Borrar un coche (`MyCarsScreen.js`, `handleDelete`) envía la solicitud con un solo toque. En la pantalla Solicitudes, aprobar/rechazar tampoco pide confirmación (en el panel del gestor sí).
4. [ ] **Las operaciones solo por tiempo nunca avisan.** `calcularPlanCoche`: `WHERE cada_km IS NOT NULL` deja fuera "Líquido frenos – cada 24 meses". Además, sin registros previos no hay ningún aviso por fecha: usar como base la fecha de alta del coche o el año de matriculación.
5. [ ] **Inicio del cliente en modo claro:** "Bienvenido, nombre" sale en texto oscuro sobre la cabecera azul y casi no se lee. Usar `colors.headerText`.
6. [ ] **Textos.**
   - Mensajes en inglés en `authController.js`: "Password must be at least 8 characters…", "Invalid email or password", "User already exists", "Server error during registration/login". También en `carController.js` ("Car not found", "Server error…") y en `managerController.js` ("User not found", "Server error promoting user").
   - Voseo en Solicitudes: "Aprobá o rechazá los pedidos de tus clientes" → "Aprueba o rechaza…".
   - Falta tilde: "Preguntale al asistente" → "Pregúntale".
7. [ ] **Error del asistente poco útil.** Si la API de Claude falla (clave inválida, sin saldo), la app solo dice "Error al consultar el asistente". Distinguir 401/402/429 y mostrar un mensaje claro.
8. [ ] **Gestor.**
   - Rechazar no permite escribir un motivo.
   - Un gestor puede aprobar sus propias solicitudes.
   - En el historial de solicitudes sale el nombre actual del usuario, no el que tenía al pedir el cambio.
   - No se puede quitar el rol de gestor desde la app.
9. [ ] **Detalles.**
   - Al añadir coche, en "Motor" se guarda el texto de relleno "Motorización OEM según versión".
   - Marcas duplicadas: "Mercedes" y "Mercedes-Benz".
   - Opel Astra solo tiene la versión "Base" (faltan datos de versiones).
   - En "Registrar servicio" el km viene vacío (placeholder "45500"); debería traer los km actuales del coche.
   - El taller introducido no se muestra en el historial.
   - Al subir muchos km de golpe, todo el plan sale vencido. Idea: al actualizar el kilometraje, preguntar qué mantenimientos se hicieron entretanto y marcarlos de una vez.
10. [ ] **Decisión pendiente:** la matrícula es única entre *todos* los usuarios (`ER_DUP_ENTRY` → 409 "Ya existe un vehículo con esa matrícula"). Si otro usuario ya la registró, no se puede añadir, y el error revela que ese coche existe en la app. ¿Única por usuario o global?

## Pruebas que faltan

- [ ] Android: registro, pago nativo de Stripe (PaymentSheet), añadir coche, actualizar km, guardar mantenimiento, plan completo, ficha técnica, perfil, ajustes, usuarios (promover y eliminar), panel del gestor (aprobar/rechazar desde el inicio), colores del gestor en modo claro, cerrar sesión.
  - Para que Claude pueda escribir en el emulador: Android Studio → File → Settings → Tools → Emulator → desmarcar "Launch in the Running Devices tool window", y relanzar el emulador (se abre en ventana propia).
  - Los emuladores actuales son Android 17 (API 37, vista previa) y dan errores de sistema en bucle; conviene crear uno con API 35 o 36.
- [ ] Asistente de Claude (cuando haya clave válida).

## Datos de prueba

- Usuario `tester.claude+1@autocontrol.test` (**gestor**), con coche Opel Astra 9876ZZQ, un registro de aceite a 91.000 km y dos solicitudes (una aprobada, una rechazada).
- Dos pagos de prueba de 16,49 € en Stripe (modo test); el primero no activó nada.
