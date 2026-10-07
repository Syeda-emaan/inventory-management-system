CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  parent_id  INT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) UNIQUE,
  phone      VARCHAR(30),
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  sku           VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  quantity      INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_suppliers (
  product_id   INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id  INT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supply_price NUMERIC(12,2) CHECK (supply_price >= 0),
  PRIMARY KEY (product_id, supplier_id)
);

CREATE TABLE product_images (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_path  VARCHAR(300) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_history (
  id              BIGSERIAL PRIMARY KEY,
  product_id      INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  change_type     VARCHAR(10) NOT NULL CHECK (change_type IN ('IN','OUT','ADJUST')),
  quantity_change INT NOT NULL,
  quantity_after  INT NOT NULL CHECK (quantity_after >= 0),
  reason          VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_price       ON products(price);
CREATE INDEX idx_products_created     ON products(created_at DESC);
CREATE INDEX idx_products_active      ON products(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_trgm   ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_images_product       ON product_images(product_id);
CREATE INDEX idx_ps_supplier          ON product_suppliers(supplier_id);
CREATE INDEX idx_history_product_time ON inventory_history(product_id, created_at DESC);