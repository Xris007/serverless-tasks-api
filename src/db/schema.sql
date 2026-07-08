-- serverless-tasks-api schema (MySQL)

CREATE TABLE IF NOT EXISTS tasks (
  id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      ENUM('pending', 'in_progress', 'done') NOT NULL DEFAULT 'pending',
  priority    ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  due_date    DATETIME NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
