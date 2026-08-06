ALTER TABLE users
  ADD COLUMN role ENUM('client', 'manager') NOT NULL DEFAULT 'client';

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
