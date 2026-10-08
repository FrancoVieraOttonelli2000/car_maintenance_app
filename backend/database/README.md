# Base de datos

Pensado para MariaDB (XAMPP). Las migraciones usan `ADD COLUMN IF NOT EXISTS`
y `CREATE INDEX IF NOT EXISTS`, que MySQL 8 no soporta.

## Instalación nueva

```bash
mysql -u root car_maintenance_app < database/schema.sql
mysql -u root car_maintenance_app < database/seed.sql
mysql -u root car_maintenance_app < database/car_fluids.sql
mysql -u root car_maintenance_app < database/seed_maintenance_plans.sql
```

`schema.sql` ya trae todas las columnas y tablas actuales, así que en una
instalación nueva **no hace falta** ejecutar las migraciones (y si se ejecutan
no pasa nada: son idempotentes).

## Base de datos existente

Ejecuta las migraciones que te falten, en orden:

```bash
mysql -u root car_maintenance_app < database/migrations/001_add_roles_and_requests.sql
mysql -u root car_maintenance_app < database/migrations/20260731_add_version_to_cars.sql
mysql -u root car_maintenance_app < database/migrations/20261008_payments_plan_tracking.sql
```

## Primer gestor

El registro público siempre crea clientes. El primer gestor se crea a mano:

```sql
UPDATE users SET role = 'manager' WHERE email = 'tu@email.com';
```
