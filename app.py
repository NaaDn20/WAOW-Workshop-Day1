from flask import Flask, render_template, jsonify, session, redirect, url_for, request
from flask_cors import CORS
from config import Config
from routes.customer_routes import customer_bp
from routes.product_routes import product_bp
from routes.transaction_routes import transaction_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)

app.register_blueprint(customer_bp, url_prefix='/api')
app.register_blueprint(product_bp, url_prefix='/api')
app.register_blueprint(transaction_bp, url_prefix='/api')
app.register_blueprint(auth_bp)

@app.before_request
def require_login():
    allowed_routes = ['auth_bp.login_page', 'auth_bp.register_page', 'auth_bp.login_api', 'auth_bp.register_api', 'static']

    if request.endpoint not in allowed_routes and 'user_id' not in session:
        return redirect(url_for('auth_bp.login_page'))

@app.route('/')
def index_page():
    return render_template('index.html')

@app.route('/customers')
def customers_page():
    return render_template('customers.html')

@app.route('/products')
def products_page():
    return render_template('products.html')

@app.route('/transactions')
def transactions_page():
    return render_template('transactions.html')

@app.route('/reports')
def reports_page():
    return render_template('reports.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Flask API is running successfully'
    })

if __name__ == '__main__':
    print("🚀 Starting WAOW Workshop Flask Application...")
    print("\nPress Ctrl+C to stop the server")
    
    app.run(debug=True, host='localhost', port=5000)