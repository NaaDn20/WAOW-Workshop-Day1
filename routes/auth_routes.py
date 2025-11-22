from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from models.user_model import User

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('index_page'))
    return render_template('login.html', hide_navbar=True)

@auth_bp.route('/register')
def register_page():
    if 'user_id' in session:
        return redirect(url_for('index_page'))
    return render_template('register.html', hide_navbar=True)

@auth_bp.route('/auth/login', methods=['POST'])

@auth_bp.route('/auth/login', methods=['POST'])
def login_api():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.login_check(email, password) 

    if user:
        session['user_id'] = user['UserID']
        session['email'] = user['Email']
        print("DEBUG: Login Sukses, Mengatur Session.")
        return jsonify({'message': 'Login Success!', 'redirect': '/'})
    else:
        print("DEBUG: Login GAGAL. Mengirim status 401.") 
        return jsonify({'error': 'Email atau Password salah!'}), 401

@auth_bp.route('/auth/register', methods=['POST'])
def register_api():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email dan Password wajib diisi!'}), 400

    user_id = User.create(email, password)

    if user_id:
        return jsonify({'message': 'Register Berhasil! Silakan Login.'}), 201
    else:
        return jsonify({'error': 'Email sudah terdaftar atau error lain.'}), 500

@auth_bp.route('/logout')
def logout():
    session.clear() 
    return redirect(url_for('auth_bp.login_page'))