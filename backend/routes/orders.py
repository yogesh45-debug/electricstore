# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify
# pyrefly: ignore [missing-import]
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Order, OrderItem, CartItem, Product
from functools import wraps

orders_bp = Blueprint('orders', __name__)

def customer_required(fn):
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        identity = get_jwt_identity()
        if not identity or identity.get('role') != 'customer':
            return jsonify({'error': 'Forbidden. Customer credentials required.'}), 403
        return fn(*args, **kwargs)
    return decorator

def _process_payment(payment_method, amount):
    """
    Mock payment processing step.
    For Card and UPI, we simulate successful payment by returning 'paid'.
    For Cash-On-Delivery (COD), we set status to 'pending'.
    
    GATEWAY INTEGRATION POINT:
    To integrate Stripe, Razorpay, or PayPal:
    1. Import the gateway library (e.g. stripe).
    2. Pass the payment intent token/ID from the frontend request.
    3. Call the gateway's charge/intent capture function here:
       e.g., charge = stripe.Charge.create(amount=int(amount*100), currency='usd', source=token)
    4. Return 'paid' on success or raise an exception on failure.
    """
    if payment_method in ['Card', 'UPI']:
        # Simulate payment success
        return 'paid'
    elif payment_method == 'COD':
        return 'pending'
    else:
        return 'failed'

@orders_bp.route('', methods=['POST'])
@customer_required
def create_order():
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    data = request.get_json() or {}
    shipping_address = data.get('shipping_address')
    payment_method = data.get('payment_method')
    
    if not shipping_address or not payment_method:
        return jsonify({'error': 'Shipping address and payment method are required.'}), 400
        
    if payment_method not in ['COD', 'Card', 'UPI']:
        return jsonify({'error': 'Invalid payment method. Supported: COD, Card, UPI.'}), 400
        
    # Get user's cart items
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({'error': 'Your cart is empty.'}), 400
        
    # Validate stock and calculate total
    total_amount = 0.0
    items_to_snapshot = []
    
    for item in cart_items:
        product = item.product
        if not product:
            return jsonify({'error': 'One of the items in your cart is no longer available.'}), 404
            
        if product.stock < item.quantity:
            return jsonify({
                'error': f'Insufficient stock for product "{product.name}". Only {product.stock} left.'
            }), 400
            
        # Calculate product final price (unit price minus discount)
        unit_price = float(product.price)
        final_unit_price = unit_price * (1 - (product.discount_percent / 100.0))
        
        total_amount += final_unit_price * item.quantity
        items_to_snapshot.append((product, item.quantity, final_unit_price))
        
    # Process payment
    payment_status = _process_payment(payment_method, total_amount)
    if payment_status == 'failed':
        return jsonify({'error': 'Payment processing failed. Please try a different payment method.'}), 400
        
    # Create order
    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        shipping_address=shipping_address,
        status='placed',
        payment_method=payment_method,
        payment_status=payment_status
    )
    
    db.session.add(order)
    db.session.flush()  # Flush to populate order.id
    
    # Process stock decrement and create order items
    for product, qty, final_price in items_to_snapshot:
        # Decrement product stock
        product.stock -= qty
        
        # Create order item snapshot
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            unit_price=final_price,
            quantity=qty
        )
        db.session.add(order_item)
        
    # Clear cart
    CartItem.query.filter_by(user_id=user_id).delete()
    
    db.session.commit()
    
    return jsonify(order.to_dict()), 201

@orders_bp.route('', methods=['GET'])
@customer_required
def get_orders():
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders]), 200

@orders_bp.route('/<int:order_id>', methods=['GET'])
@customer_required
def get_order_detail(order_id):
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({'error': 'Order not found.'}), 404
        
    return jsonify(order.to_dict()), 200

@orders_bp.route('/<int:order_id>/cancel', methods=['POST'])
@customer_required
def cancel_order(order_id):
    identity = get_jwt_identity()
    user_id = identity.get('id')
    
    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({'error': 'Order not found.'}), 404
        
    if order.status != 'placed':
        return jsonify({'error': 'Order cannot be cancelled. Only placed orders can be cancelled.'}), 400
        
    # Restore product stock
    for item in order.items:
        if item.product_id:
            product = Product.query.get(item.product_id)
            if product:
                product.stock += item.quantity
                
    order.status = 'cancelled'
    db.session.commit()
    
    return jsonify(order.to_dict()), 200

