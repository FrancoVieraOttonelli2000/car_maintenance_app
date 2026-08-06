CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100),
 email VARCHAR(150) UNIQUE NOT NULL,
 password VARCHAR(255) NOT NULL,
 role ENUM('client', 'manager') NOT NULL DEFAULT 'client',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cars (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT REFERENCES users(id),
 plate VARCHAR(20) UNIQUE NOT NULL,
 brand VARCHAR(50),
 model VARCHAR(50),
 engine VARCHAR(50),
 fuel VARCHAR(30),
 year INTEGER,
 current_km INTEGER,
 version VARCHAR(100),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_types (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100),
 interval_km INTEGER
);

CREATE TABLE maintenance (
 id INT AUTO_INCREMENT PRIMARY KEY,
 car_id INT REFERENCES cars(id),
 type_id INT REFERENCES maintenance_types(id),
 km INTEGER,
 date DATE,
 notes TEXT,
 workshop VARCHAR(150),
 own_breakdown BOOLEAN DEFAULT false
);

CREATE TABLE car_km_logs (
 id INT AUTO_INCREMENT PRIMARY KEY,
 car_id INT REFERENCES cars(id),
 km INTEGER,
 date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  version VARCHAR(100),
  motorizacion VARCHAR(255),
  codigo_familia VARCHAR(100),
  caja VARCHAR(100),
  traccion VARCHAR(100),
  tipo VARCHAR(100),
  operacion VARCHAR(255),
  cada_km INT,
  cada_meses INT,
  primera_vez_km INT,
  notas TEXT
);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  plan ENUM('monthly', 'semestral', 'annual') NOT NULL,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  resolved_by INT NULL REFERENCES users(id),
  resolution_note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL
);