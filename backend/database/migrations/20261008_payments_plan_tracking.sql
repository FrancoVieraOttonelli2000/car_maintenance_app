-- Migración del 8/10/2026. Idempotente (MariaDB / XAMPP).

-- 1) Pagos de Stripe ya usados, para que un mismo pago no active dos veces.
CREATE TABLE IF NOT EXISTS subscription_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL,
  plan ENUM('monthly', 'semestral', 'annual') NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_payment_intent (payment_intent_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Los pagos que ya activaron una suscripción quedan marcados como usados.
INSERT IGNORE INTO subscription_payments (user_id, payment_intent_id, plan, amount, currency)
SELECT user_id, stripe_payment_intent_id, plan, 0, 'eur'
FROM subscriptions
WHERE stripe_payment_intent_id IS NOT NULL;

-- 2) Kilometraje de alta de cada coche (punto de partida de los avisos).
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS initial_km INTEGER NULL AFTER current_km;

-- Para los coches que ya existen se usa el menor km conocido.
UPDATE cars c
SET c.initial_km = LEAST(
  COALESCE(c.current_km, 0),
  COALESCE((SELECT MIN(l.km) FROM car_km_logs l WHERE l.car_id = c.id), c.current_km, 0)
)
WHERE c.initial_km IS NULL;

-- 3) Registros de mantenimiento vinculados a una operación del plan de fábrica.
ALTER TABLE maintenance
  MODIFY COLUMN type_id INT NULL;
ALTER TABLE maintenance
  ADD COLUMN IF NOT EXISTS plan_operacion VARCHAR(255) NULL AFTER type_id;
CREATE INDEX IF NOT EXISTS idx_maintenance_car_plan ON maintenance (car_id, plan_operacion);

-- 4) Se borran los registros "Registro inicial" a 0 km que la app creaba sola
--    al dar de alta un coche. No los metió el usuario y hacían que un coche
--    usado empezara con todos los avisos vencidos. Ahora ese punto de partida
--    lo da cars.initial_km.
DELETE FROM maintenance
WHERE notes = 'Registro inicial' AND km = 0 AND workshop IS NULL;
