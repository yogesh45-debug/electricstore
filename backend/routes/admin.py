from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Order, Product, User, Category, BankOffer, Advertisement
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        identity = get_jwt_identity()
        if not identity or identity.get('role') != 'admin':
            return jsonify({'error': 'Forbidden. Admin credentials required.'}), 403
        return fn(*args, **kwargs)
    return decorator

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    from datetime import datetime, timedelta
    from collections import defaultdict

    # Calculate revenue from all non-cancelled orders
    orders = Order.query.filter(Order.status != 'cancelled').all()
    revenue = sum(float(order.total_amount) for order in orders)

    total_orders = Order.query.count()
    total_products = Product.query.count()
    total_customers = User.query.filter_by(role='customer').count()

    # Low stock threshold is defined as stock <= 5 units
    low_stock_count = Product.query.filter(Product.stock <= 5).count()

    # Monthly revenue for chart (last 6 months)
    monthly = defaultdict(float)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_orders = Order.query.filter(
        Order.status != 'cancelled',
        Order.created_at >= six_months_ago
    ).all()
    for o in recent_orders:
        key = o.created_at.strftime('%b')
        monthly[key] += float(o.total_amount)

    month_labels = []
    month_values = []
    for i in range(5, -1, -1):
        d = datetime.utcnow() - timedelta(days=30 * i)
        label = d.strftime('%b')
        month_labels.append(label)
        month_values.append(round(monthly.get(label, 0), 2))

    # Order status breakdown
    status_counts = {}
    for status in ['placed', 'shipped', 'delivered', 'cancelled']:
        status_counts[status] = Order.query.filter_by(status=status).count()

    # Recent 5 orders
    recent = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    return jsonify({
        'revenue': round(revenue, 2),
        'orders_count': total_orders,
        'products_count': total_products,
        'customers_count': total_customers,
        'low_stock_count': low_stock_count,
        'monthly_labels': month_labels,
        'monthly_values': month_values,
        'status_counts': status_counts,
        'recent_orders': [o.to_dict() for o in recent]
    }), 200

@admin_bp.route('/orders', methods=['GET'])
@admin_required
def get_all_orders():
    status_filter = request.args.get('status')
    
    query = Order.query
    if status_filter:
        query = query.filter(Order.status == status_filter)
        
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders]), 200

@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found.'}), 404
        
    data = request.get_json() or {}
    new_status = data.get('status')
    
    valid_statuses = ['placed', 'shipped', 'delivered', 'cancelled']
    if not new_status or new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Allowed values: {", ".join(valid_statuses)}'}), 400
        
    order.status = new_status
    
    # "when moving a cash-on-delivery order to delivered, also mark payment_status=paid"
    if new_status == 'delivered' and order.payment_method == 'COD':
        order.payment_status = 'paid'
        
    db.session.commit()
    return jsonify(order.to_dict()), 200

@admin_bp.route('/customers', methods=['GET'])
@admin_required
def get_customers():
    customers = User.query.filter_by(role='customer').order_by(User.id.asc()).all()
    return jsonify([c.to_dict() for c in customers]), 200

@admin_bp.route('/offers', methods=['GET'])
@admin_required
def get_all_offers():
    offers = BankOffer.query.order_by(BankOffer.created_at.desc()).all()
    return jsonify([o.to_dict() for o in offers]), 200

@admin_bp.route('/offers', methods=['POST'])
@admin_required
def create_offer():
    data = request.get_json() or {}
    bank_name = data.get('bank_name')
    offer_text = data.get('offer_text')
    min_purchase = data.get('min_purchase', 0.0)
    discount_value = data.get('discount_value')
    is_active = data.get('is_active', True)
    
    if not bank_name or not offer_text or discount_value is None:
        return jsonify({'error': 'Missing required fields: bank_name, offer_text, discount_value.'}), 400
        
    try:
        min_purchase = float(min_purchase)
        discount_value = float(discount_value)
    except ValueError:
        return jsonify({'error': 'min_purchase and discount_value must be valid numbers.'}), 400
        
    offer = BankOffer(
        bank_name=bank_name,
        offer_text=offer_text,
        min_purchase=min_purchase,
        discount_value=discount_value,
        is_active=is_active
    )
    
    db.session.add(offer)
    db.session.commit()
    return jsonify(offer.to_dict()), 201

@admin_bp.route('/offers/<int:offer_id>', methods=['PUT'])
@admin_required
def update_offer(offer_id):
    offer = BankOffer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found.'}), 404
        
    data = request.get_json() or {}
    
    if 'bank_name' in data:
        offer.bank_name = data['bank_name']
    if 'offer_text' in data:
        offer.offer_text = data['offer_text']
    if 'min_purchase' in data:
        try:
            offer.min_purchase = float(data['min_purchase'])
        except ValueError:
            return jsonify({'error': 'min_purchase must be a valid number.'}), 400
    if 'discount_value' in data:
        try:
            offer.discount_value = float(data['discount_value'])
        except ValueError:
            return jsonify({'error': 'discount_value must be a valid number.'}), 400
    if 'is_active' in data:
        offer.is_active = bool(data['is_active'])
        
    db.session.commit()
    return jsonify(offer.to_dict()), 200

@admin_bp.route('/offers/<int:offer_id>', methods=['DELETE'])
@admin_required
def delete_offer(offer_id):
    offer = BankOffer.query.get(offer_id)
    if not offer:
        return jsonify({'error': 'Offer not found.'}), 404
        
    db.session.delete(offer)
    db.session.commit()
    return jsonify({'message': 'Offer deleted successfully.'}), 200

@admin_bp.route('/advertisements', methods=['GET'])
@admin_required
def list_advertisements():
    ads = Advertisement.query.all()
    return jsonify([ad.to_dict() for ad in ads]), 200

@admin_bp.route('/advertisements', methods=['POST'])
@admin_required
def create_advertisement():
    data = request.get_json() or {}
    title = data.get('title')
    image_url = data.get('image_url')
    description = data.get('description')
    link_url = data.get('link_url')
    is_active = data.get('is_active', True)
    
    if not title or not image_url:
        return jsonify({'error': 'Title and background image URL are required.'}), 400
        
    ad = Advertisement(
        title=title,
        description=description,
        image_url=image_url,
        link_url=link_url,
        is_active=bool(is_active)
    )
    db.session.add(ad)
    db.session.commit()
    return jsonify(ad.to_dict()), 201

@admin_bp.route('/advertisements/<int:ad_id>', methods=['PUT'])
@admin_required
def update_advertisement(ad_id):
    ad = Advertisement.query.get(ad_id)
    if not ad:
        return jsonify({'error': 'Advertisement not found.'}), 404
        
    data = request.get_json() or {}
    
    if 'title' in data:
        ad.title = data['title']
    if 'description' in data:
        ad.description = data['description']
    if 'image_url' in data:
        ad.image_url = data['image_url']
    if 'link_url' in data:
        ad.link_url = data['link_url']
    if 'is_active' in data:
        ad.is_active = bool(data['is_active'])
        
    db.session.commit()
    return jsonify(ad.to_dict()), 200

@admin_bp.route('/advertisements/<int:ad_id>', methods=['DELETE'])
@admin_required
def delete_advertisement(ad_id):
    ad = Advertisement.query.get(ad_id)
    if not ad:
        return jsonify({'error': 'Advertisement not found.'}), 404
        
    db.session.delete(ad)
    db.session.commit()
    return jsonify({'message': 'Advertisement deleted successfully.'}), 200

