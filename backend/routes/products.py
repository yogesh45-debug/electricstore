from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Product, Category, Advertisement, Review
from functools import wraps

products_bp = Blueprint('products', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        identity = get_jwt_identity()
        if not identity or identity.get('role') != 'admin':
            return jsonify({'error': 'Forbidden. Admin credentials required.'}), 403
        return fn(*args, **kwargs)
    return decorator

@products_bp.route('', methods=['GET'])
def get_products():
    category_slug = request.args.get('category')
    search = request.args.get('search')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    brand = request.args.get('brand')
    sort = request.args.get('sort')
    min_rating = request.args.get('min_rating')
    in_stock = request.args.get('in_stock')
    on_sale = request.args.get('on_sale')
    
    # Pagination
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 8))
    except ValueError:
        page = 1
        per_page = 8
        
    query = Product.query
    
    # Filter by category slug or ID
    if category_slug:
        if category_slug.isdigit():
            query = query.filter(Product.category_id == int(category_slug))
        else:
            category = Category.query.filter_by(slug=category_slug).first()
            if category:
                query = query.filter(Product.category_id == category.id)
            else:
                return jsonify({'products': [], 'total': 0, 'page': page, 'pages': 0}), 200
                
    # Filter by search string
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Product.name.like(search_pattern),
                Product.brand.like(search_pattern),
                Product.description.like(search_pattern)
            )
        )
        
    # Filter by price ranges
    if min_price:
        try:
            query = query.filter(Product.price >= float(min_price))
        except ValueError:
            pass
    if max_price:
        try:
            query = query.filter(Product.price <= float(max_price))
        except ValueError:
            pass
            
    # Filter by brand
    if brand:
        query = query.filter(Product.brand == brand)
        
    # Filter by rating
    if min_rating:
        try:
            query = query.filter(Product.rating >= float(min_rating))
        except ValueError:
            pass

    # Filter by stock status
    if in_stock and in_stock.lower() == 'true':
        query = query.filter(Product.stock > 0)

    # Filter by sale status
    if on_sale and on_sale.lower() == 'true':
        query = query.filter(Product.discount_percent > 0)
        
    # Sorting
    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'rating':
        query = query.order_by(Product.rating.desc())
    elif sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif sort == 'id_asc':
        query = query.order_by(Product.id.asc())
    else:
        query = query.order_by(Product.id.desc())
        
    all_param = request.args.get('all')
    if all_param and all_param.lower() == 'true':
        items = query.all()
        return jsonify({
            'products': [p.to_dict() for p in items],
            'total': len(items),
            'page': 1,
            'pages': 1
        }), 200

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    }), 200

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@products_bp.route('/offers', methods=['GET'])
def get_active_offers():
    from models import BankOffer
    offers = BankOffer.query.filter_by(is_active=True).all()
    return jsonify([o.to_dict() for o in offers]), 200

@products_bp.route('/advertisements', methods=['GET'])
def get_active_advertisements():
    ads = Advertisement.query.filter_by(is_active=True).all()
    return jsonify([ad.to_dict() for ad in ads]), 200


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found.'}), 404
    return jsonify(product.to_dict()), 200

@products_bp.route('', methods=['POST'])
@admin_required
def create_product():
    data = request.get_json() or {}
    
    name = data.get('name')
    brand = data.get('brand')
    description = data.get('description')
    price = data.get('price')
    discount_percent = data.get('discount_percent', 0)
    stock = data.get('stock')
    image_url = data.get('image_url')
    specs = data.get('specs')  # Should be JSON dict
    about_item = data.get('about_item')  # Text
    rating = data.get('rating', 0.0)
    category_id = data.get('category_id')
    
    if not name or not brand or price is None or stock is None or not category_id:
        return jsonify({'error': 'Missing required fields: name, brand, price, stock, category_id.'}), 400
        
    try:
        price = float(price)
        stock = int(stock)
        category_id = int(category_id)
    except ValueError:
        return jsonify({'error': 'Price, stock, and category_id must be valid numbers.'}), 400
        
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Invalid category ID.'}), 400
        
    product = Product(
        name=name,
        brand=brand,
        description=description,
        price=price,
        discount_percent=discount_percent,
        stock=stock,
        image_url=image_url,
        gallery_images=data.get('gallery_images', []),
        specs=specs,
        about_item=about_item,
        rating=rating,
        category_id=category_id
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict()), 201

@products_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found.'}), 404
        
    data = request.get_json() or {}
    
    if 'name' in data:
        product.name = data['name']
    if 'brand' in data:
        product.brand = data['brand']
    if 'description' in data:
        product.description = data['description']
    if 'price' in data:
        try:
            product.price = float(data['price'])
        except ValueError:
            return jsonify({'error': 'Price must be a valid decimal number.'}), 400
    if 'discount_percent' in data:
        product.discount_percent = int(data['discount_percent'])
    if 'stock' in data:
        try:
            product.stock = int(data['stock'])
        except ValueError:
            return jsonify({'error': 'Stock must be an integer.'}), 400
    if 'image_url' in data:
        product.image_url = data['image_url']
    if 'gallery_images' in data:
        product.gallery_images = data['gallery_images']
    if 'specs' in data:
        product.specs = data['specs']
    if 'about_item' in data:
        product.about_item = data['about_item']
    if 'rating' in data:
        product.rating = float(data['rating'])
    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category ID.'}), 400
        product.category_id = data['category_id']
        
    db.session.commit()
    return jsonify(product.to_dict()), 200

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found.'}), 404
        
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully.'}), 200

@products_bp.route('/<int:product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found.'}), 404
    reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews]), 200

@products_bp.route('/<int:product_id>/reviews', methods=['POST'])
@jwt_required()
def add_product_review(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found.'}), 404
        
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    data = request.get_json() or {}
    rating = data.get('rating')
    comment = data.get('comment')
    
    if rating is None or not comment:
        return jsonify({'error': 'Rating and comment are required.'}), 400
        
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError()
    except ValueError:
        return jsonify({'error': 'Rating must be an integer between 1 and 5.'}), 400
        
    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        comment=str(comment).strip()
    )
    db.session.add(review)
    db.session.flush()
    
    # Recalculate average rating for the product
    all_reviews = Review.query.filter_by(product_id=product_id).all()
    if all_reviews:
        total_rating = sum(r.rating for r in all_reviews)
        avg_rating = round(total_rating / len(all_reviews), 1)
        product.rating = avg_rating
    else:
        product.rating = float(rating)
        
    db.session.commit()
    return jsonify(review.to_dict()), 201
