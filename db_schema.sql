PRAGMA foreign_keys=ON;

BEGIN TRANSACTION; 

DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS measurements;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stock_tracking;
DROP TABLE IF EXISTS movement_types;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS stock_movement;

CREATE TABLE IF NOT EXISTS categories (
    categoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    categoryName VARCHAR(50) NOT NULL UNIQUE,
    categoryCode TEXT NOT NULL UNIQUE
); 

CREATE TABLE IF NOT EXISTS measurements (
    measurementID INTEGER PRIMARY KEY AUTOINCREMENT, 
    measurementName VARCHAR(50) NOT NULL UNIQUE,
    abbreviation VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    productID INTEGER PRIMARY KEY AUTOINCREMENT,
    productName VARCHAR(50) NOT NULL,
    productSKU VARCHAR(100) UNIQUE NOT NULL,
    categoryID INT NOT NULL,
    productDesc TEXT,
    measurementID INT NOT NULL,

    FOREIGN KEY (categoryID) REFERENCES categories(categoryID) ON DELETE RESTRICT,  
    FOREIGN KEY (measurementID) REFERENCES measurements(measurementID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS stock_tracking (
    stockID INTEGER PRIMARY KEY AUTOINCREMENT,
    productID INTEGER UNIQUE NOT NULL,
    currentStock DECIMAL(10,2) NOT NULL DEFAULT 0,
    availableStock DECIMAL(10,2) NOT NULL DEFAULT 0,
    damagedStock DECIMAL(10,2) NOT NULL DEFAULT 0, 
    stockInTransit DECIMAL(10,2) NOT NULL DEFAULT 0, 
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, 

    FOREIGN KEY (productID) REFERENCES products(productID) ON DELETE RESTRICT

);

CREATE TABLE IF NOT EXISTS movement_types (
    movementTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
    movementTypeName VARCHAR(50) UNIQUE NOT NULL
); 

CREATE TABLE IF NOT EXISTS roles (
    roleID INTEGER PRIMARY KEY AUTOINCREMENT,
    roleName VARCHAR(50) NOT NULL UNIQUE 
);

CREATE TABLE IF NOT EXISTS users (
    userID INTEGER PRIMARY KEY AUTOINCREMENT, 
    userName VARCHAR(50) UNIQUE NOT NULL, 
    userEmail TEXT NOT NULL UNIQUE, 
    userPassword TEXT NOT NULL, 
    userRole INTEGER NOT NULL,

    FOREIGN KEY (userRole) REFERENCES roles(roleID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS stock_movement (
    movementID INTEGER PRIMARY KEY AUTOINCREMENT,
    productID INTEGER NOT NULL, 
    movementTypeID INTEGER NOT NULL, 
    quantity DECIMAL(10,2) NOT NULL,
    createdBy INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT, 
    
    FOREIGN KEY (productID) REFERENCES products(productID) ON DELETE RESTRICT,
    FOREIGN KEY (movementTypeID) REFERENCES movement_types(movementTypeID) ON DELETE RESTRICT,
    FOREIGN KEY (createdBy) REFERENCES users(userID) ON DELETE RESTRICT

);

INSERT OR IGNORE INTO movement_types (movementTypeName) VALUES
('IN'),
('OUT'),
('RETURN'),
('DAMAGED'),
('ADJUSTMENT'),
('TRANSFER');

INSERT OR IGNORE INTO roles (roleName) VALUES
('Admin'),
('Staff');

INSERT OR IGNORE INTO measurements (measurementName, abbreviation) VALUES
('Pieces', 'pcs'),
('Boxes', 'box'),
('Kilograms', 'kg'),
('Grams', 'g'),
('Liters', 'L'),
('Milliliters', 'ml'),
('Bottles', 'bottle'),
('Cans', 'can');

INSERT OR IGNORE INTO categories (categoryName, categoryCode) VALUES
('Beverage', 'BVG'),
('Snacks', 'SNK'),
('Stationery', 'STY'),
('Household', 'HSH'),
('Personal Care', 'PCR');

COMMIT; 