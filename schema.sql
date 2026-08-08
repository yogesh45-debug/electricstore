-- ElectroStore MySQL Database Schema

CREATE DATABASE IF NOT EXISTS electrostore_db;
USE electrostore_db;

-- 1. Users Table (Customers and Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_percent INT DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    specs JSON,
    rating DECIMAL(2,1) DEFAULT 0.0,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    status ENUM('placed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'placed',
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Order Items Table (Snapshots product name and price at time of order)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bank Offers Table
CREATE TABLE IF NOT EXISTS bank_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    offer_text VARCHAR(255) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0.00,
    discount_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Advertisements Table
CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Seed Categories
INSERT INTO categories (id, name, slug) VALUES 
(1, 'Smartphones', 'smartphones'),
(2, 'Laptops', 'laptops'),
(3, 'Audio', 'audio'),
(4, 'Wearables', 'wearables'),
(5, 'Accessories', 'accessories'),
(6, 'TVs & Monitors', 'tvs-monitors'),
(7, 'Tablets', 'tablets')
ON DUPLICATE KEY UPDATE name=name;

-- Seed Sample Products with detailed specs JSON
INSERT INTO products (id, name, brand, description, price, discount_percent, stock, image_url, specs, rating, category_id) VALUES
-- Smartphones
(1, 'Agni 2 5G', 'Lava', 'India\'s own flagship killer featuring a curved AMOLED screen and Dimensity 7050 processor.', 19920.00, 8, 25, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500', '{"RAM": "8GB", "Storage": "256GB", "Battery": "4700mAh", "Display": "6.78 inch Curved AMOLED"}', 4.6, 1),
(2, 'IN Note 2', 'Micromax', 'Stylish and powerful smartphone with a brilliant AMOLED screen and clean user experience.', 11920.00, 12, 15, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', '{"RAM": "4GB", "Storage": "64GB", "Battery": "5000mAh", "Display": "6.43 inch AMOLED"}', 4.3, 1),

-- Laptops
(3, 'JioBook 11', 'Jio', 'Ultra-lightweight and budget-friendly educational laptop designed in India with JioOS.', 15920.00, 5, 30, 'https://images.unsplash.com/photo-1496181130204-755241544e3f?w=500', '{"RAM": "4GB", "Storage": "64GB eMMC", "OS": "JioOS", "Processor": "MediaTek MT8788"}', 4.1, 2),
(4, 'Primebook 4G', 'Primebook', 'Android-based laptop for students, featuring 4G connectivity and educational apps.', 14320.00, 10, 20, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500', '{"RAM": "4GB", "Storage": "64GB", "OS": "PrimeOS", "Processor": "MediaTek MT8788"}', 4.2, 2),

-- Audio
(5, 'Nirvanaa 751 ANC', 'boAt', 'Premium wireless over-ear headphones with active noise cancellation and massive playback time.', 3920.00, 15, 40, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', '{"Type": "Over-Ear", "Battery": "65 hours", "ANC": "Yes (33dB)", "Bluetooth": "5.0"}', 4.5, 3),
(6, 'Buds VS104', 'Noise', 'Ergonomic true wireless earbuds with Instacharge and powerful driver size.', 1520.00, 0, 50, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', '{"Type": "In-Ear", "Battery": "45 hours", "Driver Size": "13mm", "Bluetooth": "5.2"}', 4.4, 3),

-- Wearables
(7, 'ColorFit Pro 5', 'Noise', 'Indian smartwatch with AMOLED display, Bluetooth calling, and health suite tracking.', 3920.00, 5, 25, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500', '{"Size": "1.85 inch", "Battery": "7 days", "OS": "NoiseOS", "Sensors": "Heart Rate, SpO2, Sleep"}', 4.5, 4),
(8, 'Gladiator Smartwatch', 'Fire-Boltt', 'Large-display smartwatch with Bluetooth calling, sports modes, and high brightness.', 3120.00, 10, 18, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500', '{"Size": "1.96 inch", "Battery": "7 days", "OS": "Proprietary", "Sensors": "HR, SpO2, BP Monitor"}', 4.3, 4),

-- Accessories
(9, 'Toad II Wireless Mouse', 'Portronics', 'Ergonomic silent wireless mouse with adjustable DPI and reliable rechargeable battery.', 960.00, 0, 35, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500', '{"Type": "Wireless Mouse", "DPI": "1600", "Battery": "Rechargeable", "Connectivity": "2.4GHz USB"}', 4.2, 5),
(10, 'Zeb-Max Pro Keyboard', 'Zebronics', 'Mechanical gaming keyboard with tactile blue switches and custom RGB lighting.', 3120.00, 15, 22, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', '{"Type": "Mechanical Keyboard", "Layout": "Full Size", "Switches": "Blue Mechanical", "Backlight": "RGB"}', 4.6, 5),

-- TVs & Monitors
(11, 'Vu GloLED TV', 'Vu', 'Premium glo-panel smart TV with cinematic Dolby Atmos speaker output and Google TV OS.', 39920.00, 10, 8, 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500', '{"Resolution": "4K UHD", "Size": "55 inch", "Panel": "GloLED", "Smart OS": "Google TV"}', 4.8, 6),
(12, 'Daiwa 43" Smart TV', 'Daiwa', 'Affordable Smart TV built in India featuring a Full HD display and smart remote.', 18320.00, 5, 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', '{"Resolution": "Full HD", "Size": "43 inch", "Panel": "D-LED", "Smart OS": "webOS"}', 4.2, 6),

-- Tablets
(13, 'OnePlus Pad Go', 'OnePlus', 'Powerful entertainment tablet featuring a 2.4K eye-care display and Dolby Atmos quad speakers.', 17999.00, 10, 15, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500', '{"RAM": "8GB", "Storage": "128GB", "Battery": "8000mAh", "Display": "11.35 inch 2.4K"}', 4.5, 7),
(14, 'Lenovo Tab P12', 'Lenovo', 'Large-screen tablet perfect for streaming, gaming, and productivity with stylus support.', 26999.00, 12, 10, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500', '{"RAM": "8GB", "Storage": "256GB", "Battery": "10200mAh", "Display": "12.7 inch 3K"}', 4.6, 7)
ON DUPLICATE KEY UPDATE name=name;

-- Seed Bank Offers
INSERT INTO bank_offers (id, bank_name, offer_text, min_purchase, discount_value, is_active) VALUES
(1, 'HDFC Bank', '10% Instant Discount on HDFC Credit Cards', 5000.00, 1500.00, 1),
(2, 'ICICI Bank', '5% Cashback on ICICI Debit Cards', 3000.00, 500.00, 1),
(3, 'SBI Card', 'Flat $100 Off on SBI Credit Card EMI', 10000.00, 1000.00, 1)
ON DUPLICATE KEY UPDATE bank_name=bank_name;

-- Seed Advertisements
INSERT INTO advertisements (id, title, description, image_url, link_url, is_active) VALUES
(1, 'Next-Gen Tech is Now Within Your Reach', 'Compare, select, and buy top-rated electronics with full local warranty.', 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600', '/products', 1),
(2, 'Unleash Ultimate Performance', 'Save up to 15% on high-performance laptops and computer accessories.', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1600', '/products?category=laptops', 1),
(3, 'Studio Quality Audio Everywhere', 'Explore wireless noise-canceling headphones and earbuds from top Indian brands.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600', '/products?category=audio', 1)
ON DUPLICATE KEY UPDATE title=title;

