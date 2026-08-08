from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, CartItem, Product
from functools import wraps

cart_bp = Blueprint('cart', __name__)

def customer_required(fn):
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        identity = get_jwt_identity()
        if not identity or identity.get('role') != 'customer':
            return jsonify({'error': 'Forbidden. Customer accounts only.'}), 403
        return fn(*args, **kwargs)
    return decorator

@cart_bp.route('', methods=['GET'])
@customer_required
def get_cart():
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    
    subtotal = 0.0
    items_list = []
    for item in cart_items:
        item_dict = item.to_dict()
        if item.product:
            # Apply product discount if applicable
            price = float(item.product.price)
            discount = item.product.discount_percent
            final_price = price * (1 - discount / 100.0)
            subtotal += final_price * item.quantity
            item_dict['product']['final_price'] = final_price
        items_list.append(item_dict)
        
    return jsonify({
        'items': items_list,
        'subtotal': round(subtotal, 2)
    }), 200

@cart_bp.route('', methods=['POST'])
@customer_required
def add_to_cart():
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({'error': 'Product ID required.'}), 400
        
    try:
        quantity = int(quantity)
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0.'}), 400
    except ValueError:
        return jsonify({'error': 'Quantity must be an integer.'}), 400
        
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found.'}), 404
        
    # Check if quantity exceeds stock
    if product.stock < quantity:
        return jsonify({'error': f'Cannot add item. Only {product.stock} units in stock.'}), 400
        
    # Check if item already exists in cart
    cart_item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if cart_item:
        new_quantity = cart_item.quantity + quantity
        if product.stock < new_quantity:
            return jsonify({'error': f'Cannot update cart. Total quantity would exceed available stock ({product.stock}).'}), 400
        cart_item.quantity = new_quantity
    else:
        cart_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
        
    db.session.commit()
    return jsonify(cart_item.to_dict()), 200

@cart_bp.route('/<int:item_id>', methods=['PUT'])
@customer_required
def update_cart_item(item_id):
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    data = request.get_json() or {}
    quantity = data.get('quantity')
    
    if quantity is None:
        return jsonify({'error': 'Quantity field required.'}), 400
        
    try:
        quantity = int(quantity)
    except ValueError:
        return jsonify({'error': 'Quantity must be an integer.'}), 400
        
    cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not cart_item:
        return jsonify({'error': 'Cart item not found.'}), 404
        
    if quantity <= 0:
        db.session.delete(cart_item)
        db.session.commit()
        return jsonify({'message': 'Cart item removed.'}), 200
        
    # Check product stock
    if cart_item.product and cart_item.product.stock < quantity:
        return jsonify({'error': f'Only {cart_item.product.stock} items left in stock.'}), 400
        
    cart_item.quantity = quantity
    db.session.commit()
    return jsonify(cart_item.to_dict()), 200

@cart_bp.route('/<int:item_id>', methods=['DELETE'])
@customer_required
def delete_cart_item(item_id):
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not cart_item:
        return jsonify({'error': 'Cart item not found.'}), 404
        
    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({'message': 'Cart item removed successfully.'}), 200
