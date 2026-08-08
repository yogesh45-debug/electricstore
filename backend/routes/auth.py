from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    address = data.get('address')
    
    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required fields.'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email address already registered.'}), 400
        
    user = User(
        name=name,
        email=email,
        phone=phone,
        address=address,
        role='customer'  # Registration only allows customer role
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token with role in the identity
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials.'}), 401
        
    if user.role == 'admin':
        return jsonify({
            'error': 'Admin account detected. Please use the Admin login portal.'
        }), 403
        
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials.'}), 401
        
    if user.role != 'admin':
        return jsonify({
            'error': 'Unauthorized. Customer accounts are not allowed to log in via admin portal.'
        }), 403
        
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
        
    return jsonify(user.to_dict()), 200

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id')

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'phone' in data:
        user.phone = data['phone'].strip()
    if 'address' in data:
        user.address = data['address'].strip()

    # Optional password change
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    if current_password and new_password:
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect.'}), 400
        user.set_password(new_password)

    db.session.commit()
    return jsonify(user.to_dict()), 200
