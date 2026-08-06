INSERT INTO maintenance_types (id, name, interval_km) VALUES
(1, 'Cambio de Aceite',         10000),
(2, 'Rotación de Neumáticos',   15000),
(3, 'Inspección de Frenos',     20000),
(4, 'Filtro de Aire',           25000),
(5, 'Revisión Completa',        30000)
ON DUPLICATE KEY UPDATE name = VALUES(name), interval_km = VALUES(interval_km);
