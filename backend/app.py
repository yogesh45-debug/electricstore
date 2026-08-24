import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Category, Product, Advertisement, Review

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['JWT_VERIFY_SUB'] = False
    
    # Enable CORS for the API
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize Database and JWT Manager
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.products import products_bp
    from routes.cart import cart_bp
    from routes.orders import orders_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'message': 'ElectroStore API is running'}), 200

    # Auto-seed the database if tables are empty or seed users are missing
    with app.app_context():
        try:
            db.create_all()
            
            # Check if about_item column exists in products table, and if not, add it
            engine = db.engine
            from sqlalchemy import inspect
            inspector = inspect(engine)
            columns = [c['name'] for c in inspector.get_columns('products')]
            if 'about_item' not in columns:
                with db.engine.connect() as conn:
                    conn.execute(db.text("ALTER TABLE products ADD COLUMN about_item TEXT"))
                    conn.commit()
            
            # Set default about_item for existing products
            from models import Product
            products_without_about = Product.query.filter(
                (Product.about_item == None) | (Product.about_item == '')
            ).all()
            for p in products_without_about:
                p.about_item = (
                    "Premium quality components designed for durability\n"
                    "High performance configuration tuned for speed\n"
                    "Excellent energy efficiency with long-lasting battery life\n"
                    "Modern sleek design with premium aesthetic feel"
                )
            db.session.commit()
            
            seed_database()
        except Exception as e:
            app.logger.error(f"Error initializing or seeding the database on startup: {str(e)}")
            app.logger.error("Please ensure MySQL is running and your .env configuration is correct.")
            
    return app

def seed_database():
    # 1. Seed Users if not present
    admin_email = "admin@electrostore.com"
    customer_email = "customer@electrostore.com"
    
    admin = User.query.filter_by(email=admin_email).first()
    if not admin:
        admin_user = User(
            name="Admin User",
            email=admin_email,
            role="admin",
            phone="9999999999",
            address="ElectroStore HQ"
        )
        admin_user.set_password("adminpassword")
        db.session.add(admin_user)
        
    customer = User.query.filter_by(email=customer_email).first()
    if not customer:
        customer_user = User(
            name="Demo Customer",
            email=customer_email,
            role="customer",
            phone="1234567890",
            address="123 Tech Avenue, Silicon Valley"
        )
        customer_user.set_password("customerpassword")
        db.session.add(customer_user)
        
    # 2. Seed Categories if empty
    categories_data = [
        {"name": "Smartphones", "slug": "smartphones"},
        {"name": "Laptops", "slug": "laptops"},
        {"name": "Audio", "slug": "audio"},
        {"name": "Wearables", "slug": "wearables"},
        {"name": "Accessories", "slug": "accessories"},
        {"name": "TVs & Monitors", "slug": "tvs-monitors"},
        {"name": "Tablets", "slug": "tablets"}
    ]
    
    category_map = {}
    for cat_data in categories_data:
        cat = Category.query.filter_by(slug=cat_data["slug"]).first()
        if not cat:
            cat = Category(name=cat_data["name"], slug=cat_data["slug"])
            db.session.add(cat)
            db.session.flush() # Flush to get IDs
        category_map[cat_data["slug"]] = cat.id
        
    # 3. Seed Products if empty
    if Product.query.count() == 0:
        products_data = [
            # Smartphones
            {
                "name": "Agni 2 5G", "brand": "Lava",
                "description": "India's own flagship killer featuring a curved AMOLED screen and Dimensity 7050 processor.",
                "price": 19920.00, "discount_percent": 8, "stock": 25,
                "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500",
                "specs": {"RAM": "8GB", "Storage": "256GB", "Battery": "4700mAh", "Display": "6.78 inch Curved AMOLED"},
                "rating": 4.6, "category_slug": "smartphones"
            },
            {
                "name": "IN Note 2", "brand": "Micromax",
                "description": "Stylish and powerful smartphone with a brilliant AMOLED screen and clean user experience.",
                "price": 11920.00, "discount_percent": 12, "stock": 15,
                "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
                "specs": {"RAM": "4GB", "Storage": "64GB", "Battery": "5000mAh", "Display": "6.43 inch AMOLED"},
                "rating": 4.3, "category_slug": "smartphones"
            },
            # Laptops
            {
                "name": "JioBook 11", "brand": "Jio",
                "description": "Ultra-lightweight and budget-friendly educational laptop designed in India with JioOS.",
                "price": 15920.00, "discount_percent": 5, "stock": 30,
                "image_url": "https://images.unsplash.com/photo-1496181130204-755241544e3f?w=500",
                "specs": {"RAM": "4GB", "Storage": "64GB eMMC", "OS": "JioOS", "Processor": "MediaTek MT8788"},
                "rating": 4.1, "category_slug": "laptops"
            },
            {
                "name": "Primebook 4G", "brand": "Primebook",
                "description": "Android-based laptop for students, featuring 4G connectivity and educational apps.",
                "price": 14320.00, "discount_percent": 10, "stock": 20,
                "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500",
                "specs": {"RAM": "4GB", "Storage": "64GB", "OS": "PrimeOS", "Processor": "MediaTek MT8788"},
                "rating": 4.2, "category_slug": "laptops"
            },
            # Audio
            {
                "name": "Nirvanaa 751 ANC", "brand": "boAt",
                "description": "Premium wireless over-ear headphones with active noise cancellation and massive playback time.",
                "price": 3920.00, "discount_percent": 15, "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
                "specs": {"Type": "Over-Ear", "Battery": "65 hours", "ANC": "Yes (33dB)", "Bluetooth": "5.0"},
                "rating": 4.5, "category_slug": "audio"
            },
            {
                "name": "Buds VS104", "brand": "Noise",
                "description": "Ergonomic true wireless earbuds with Instacharge and powerful driver size.",
                "price": 1520.00, "discount_percent": 0, "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
                "specs": {"Type": "In-Ear", "Battery": "45 hours", "Driver Size": "13mm", "Bluetooth": "5.2"},
                "rating": 4.4, "category_slug": "audio"
            },
            # Wearables
            {
                "name": "ColorFit Pro 5", "brand": "Noise",
                "description": "Indian smartwatch with AMOLED display, Bluetooth calling, and health suite tracking.",
                "price": 3920.00, "discount_percent": 5, "stock": 25,
                "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
                "specs": {"Size": "1.85 inch", "Battery": "7 days", "OS": "NoiseOS", "Sensors": "Heart Rate, SpO2, Sleep"},
                "rating": 4.5, "category_slug": "wearables"
            },
            {
                "name": "Gladiator Smartwatch", "brand": "Fire-Boltt",
                "description": "Large-display smartwatch with Bluetooth calling, sports modes, and high brightness.",
                "price": 3120.00, "discount_percent": 10, "stock": 18,
                "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500",
                "specs": {"Size": "1.96 inch", "Battery": "7 days", "OS": "Proprietary", "Sensors": "HR, SpO2, BP Monitor"},
                "rating": 4.3, "category_slug": "wearables"
            },
            # Accessories
            {
                "name": "Toad II Wireless Mouse", "brand": "Portronics",
                "description": "Ergonomic silent wireless mouse with adjustable DPI and reliable rechargeable battery.",
                "price": 960.00, "discount_percent": 0, "stock": 35,
                "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500",
                "specs": {"Type": "Wireless Mouse", "DPI": "1600", "Battery": "Rechargeable", "Connectivity": "2.4GHz USB"},
                "rating": 4.2, "category_slug": "accessories"
            },
            {
                "name": "Zeb-Max Pro Keyboard", "brand": "Zebronics",
                "description": "Mechanical gaming keyboard with tactile blue switches and custom RGB lighting.",
                "price": 3120.00, "discount_percent": 15, "stock": 22,
                "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
                "specs": {"Type": "Mechanical Keyboard", "Layout": "Full Size", "Switches": "Blue Mechanical", "Backlight": "RGB"},
                "rating": 4.6, "category_slug": "accessories"
            },
            # TVs & Monitors
            {
                "name": "Vu GloLED TV", "brand": "Vu",
                "description": "Premium glo-panel smart TV with cinematic Dolby Atmos speaker output and Google TV OS.",
                "price": 39920.00, "discount_percent": 10, "stock": 8,
                "image_url": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500",
                "specs": {"Resolution": "4K UHD", "Size": "55 inch", "Panel": "GloLED", "Smart OS": "Google TV"},
                "rating": 4.8, "category_slug": "tvs-monitors"
            },
            {
                "name": "Daiwa 43-inch Smart TV", "brand": "Daiwa",
                "description": "Affordable Smart TV built in India featuring a Full HD display and smart remote.",
                "price": 18320.00, "discount_percent": 5, "stock": 12,
                "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500",
                "specs": {"Resolution": "Full HD", "Size": "43 inch", "Panel": "D-LED", "Smart OS": "webOS"},
                "rating": 4.2, "category_slug": "tvs-monitors"
            }
        ]
        
        for prod_data in products_data:
            cat_id = category_map[prod_data["category_slug"]]
            prod = Product(
                name=prod_data["name"],
                brand=prod_data["brand"],
                description=prod_data["description"],
                price=prod_data["price"],
                discount_percent=prod_data["discount_percent"],
                stock=prod_data["stock"],
                image_url=prod_data["image_url"],
                specs=prod_data["specs"],
                about_item=prod_data.get("about_item", 
                    "Premium quality components designed for durability\n"
                    "High performance configuration tuned for speed\n"
                    "Excellent energy efficiency with long-lasting battery life\n"
                    "Modern sleek design with premium aesthetic feel"
                ),
                rating=prod_data["rating"],
                category_id=cat_id
            )
            db.session.add(prod)
            
    # 3b. Seed Tablets specifically if tablets category is empty of products
    tablets_cat_id = category_map.get("tablets")
    if tablets_cat_id and Product.query.filter_by(category_id=tablets_cat_id).count() == 0:
        tablet_products = [
            {
                "name": "OnePlus Pad Go", "brand": "OnePlus",
                "description": "Powerful entertainment tablet featuring a 2.4K eye-care display and Dolby Atmos quad speakers.",
                "price": 17999.00, "discount_percent": 10, "stock": 15,
                "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
                "specs": {"RAM": "8GB", "Storage": "128GB", "Battery": "8000mAh", "Display": "11.35 inch 2.4K"},
                "rating": 4.5
            },
            {
                "name": "Lenovo Tab P12", "brand": "Lenovo",
                "description": "Large-screen tablet perfect for streaming, gaming, and productivity with stylus support.",
                "price": 26999.00, "discount_percent": 12, "stock": 10,
                "image_url": "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500",
                "specs": {"RAM": "8GB", "Storage": "256GB", "Battery": "10200mAh", "Display": "12.7 inch 3K"},
                "rating": 4.6
            }
        ]
        for prod_data in tablet_products:
            prod = Product(
                name=prod_data["name"],
                brand=prod_data["brand"],
                description=prod_data["description"],
                price=prod_data["price"],
                discount_percent=prod_data["discount_percent"],
                stock=prod_data["stock"],
                image_url=prod_data["image_url"],
                specs=prod_data["specs"],
                about_item=(
                    "Premium quality components designed for durability\n"
                    "High performance configuration tuned for speed\n"
                    "Excellent energy efficiency with long-lasting battery life\n"
                    "Modern sleek design with premium aesthetic feel"
                ),
                rating=prod_data["rating"],
                category_id=tablets_cat_id
            )
            db.session.add(prod)
            
    # 4. Seed Bank Offers if empty
    from models import BankOffer
    if BankOffer.query.count() == 0:
        offers_data = [
            {
                "bank_name": "HDFC Bank",
                "offer_text": "10% Instant Discount up to ₹1,500 on HDFC Bank Credit Card transactions. Min. purchase ₹5,000.",
                "min_purchase": 5000.00,
                "discount_value": 1500.00,
                "is_active": True
            },
            {
                "bank_name": "ICICI Bank",
                "offer_text": "10% Instant Discount up to ₹1,250 on ICICI Bank Debit Card transactions. Min. purchase ₹5,000.",
                "min_purchase": 5000.00,
                "discount_value": 1250.00,
                "is_active": True
            },
            {
                "bank_name": "SBI Card",
                "offer_text": "Flat ₹2,000 Instant Discount on SBI Credit Card EMI transactions. Min. purchase ₹20,000.",
                "min_purchase": 20000.00,
                "discount_value": 2000.00,
                "is_active": True
            }
        ]
        for offer_data in offers_data:
            offer = BankOffer(
                bank_name=offer_data["bank_name"],
                offer_text=offer_data["offer_text"],
                min_purchase=offer_data["min_purchase"],
                discount_value=offer_data["discount_value"],
                is_active=offer_data["is_active"]
            )
            db.session.add(offer)
            
    # 5. Seed Advertisements if empty
    if Advertisement.query.count() == 0:
        ads_data = [
            {
                "title": "Next-Gen Tech is Now Within Your Reach",
                "description": "Compare, select, and buy top-rated electronics. Discover verified specs, authentic customer ratings, and flexible payments.",
                "image_url": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600",
                "link_url": "/products",
                "is_active": True
            },
            {
                "title": "Unleash Ultimate Performance",
                "description": "Save up to 15% on high-performance laptops. Scoped exclusively to premium notebooks and student gear.",
                "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1600",
                "link_url": "/products?category=laptops",
                "is_active": True
            },
            {
                "title": "Studio Quality Audio Everywhere",
                "description": "Explore wireless noise-canceling headphones and premium true wireless earbuds from boAt and Noise.",
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600",
                "link_url": "/products?category=audio",
                "is_active": True
            }
        ]
        for ad_data in ads_data:
            ad = Advertisement(
                title=ad_data["title"],
                description=ad_data["description"],
                image_url=ad_data["image_url"],
                link_url=ad_data["link_url"],
                is_active=ad_data["is_active"]
            )
            db.session.add(ad)
            
    # 6. Seed Reviews if empty
    if Review.query.count() == 0:
        keyboard = Product.query.filter_by(name="Zeb-Max Pro Keyboard").first()
        tv = Product.query.filter_by(name="Vu GloLED TV").first()
        phone = Product.query.filter_by(name="Agni 2 5G").first()
        customer_user = User.query.filter_by(role='customer').first()
        
        if customer_user:
            reviews_data = []
            if keyboard:
                reviews_data.extend([
                    {
                        "product_id": keyboard.id,
                        "user_id": customer_user.id,
                        "rating": 5,
                        "comment": "Absolutely brilliant mechanical keyboard! The blue switches are extremely clicky and tactile. The RGB lighting is customizable and looks gorgeous at night. High quality build!"
                    },
                    {
                        "product_id": keyboard.id,
                        "user_id": customer_user.id,
                        "rating": 4,
                        "comment": "Very good keyboard for the price. The metal body feels premium. Only downside is that it is a bit loud for office environments, but great for gaming!"
                    }
                ])
            if tv:
                reviews_data.extend([
                    {
                        "product_id": tv.id,
                        "user_id": customer_user.id,
                        "rating": 5,
                        "comment": "This TV exceeded my expectations! The colors are incredibly vibrant thanks to the GloLED panel. Sound quality is deep and loud. Highly recommended!"
                    }
                ])
            if phone:
                reviews_data.extend([
                    {
                        "product_id": phone.id,
                        "user_id": customer_user.id,
                        "rating": 4,
                        "comment": "Great phone! The curved screen is beautiful and feels premium. Dimensity 7050 runs smoothly. Battery life is decent, charges very fast."
                    }
                ])
                
            for r_data in reviews_data:
                review = Review(
                    product_id=r_data["product_id"],
                    user_id=r_data["user_id"],
                    rating=r_data["rating"],
                    comment=r_data["comment"]
                )
                db.session.add(review)
            
    db.session.commit()

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = '0.0.0.0'
    # Check if debug mode is enabled in the env or app config
    debug_env = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    debug = debug_env or app.config.get('DEBUG', False)
    
    if debug:
        print(f"Starting Flask development server on http://{host}:{port} (debug=True)...")
        app.run(host=host, port=port, debug=True)
    else:
        try:
            from waitress import serve
            print(f"Starting production WSGI server (waitress) on http://{host}:{port}...")
            serve(app, host=host, port=port)
        except ImportError:
            print("WARNING: Waitress is not installed. Falling back to Flask development server.")
            app.run(host=host, port=port)
