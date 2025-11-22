from database.connection import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User:
    # Fungsi Login: Mencari user berdasarkan email
    # Di models/user_model.py

    @staticmethod
    def login_check(email, password):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE Email = %s", (email,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()

        print(f"DEBUG: Mencari User Email: {email}")
        
        if not user:
            print("DEBUG: User TIDAK DITEMUKAN di database.")
            return None
            
        print(f"DEBUG: User DITEMUKAN. ID: {user['UserID']}")
        
        hashed_password_from_db = user['password'] 
        
        is_valid = check_password_hash(hashed_password_from_db, password)
        
        print(f"DEBUG: Password dari DB (Hash): {hashed_password_from_db[:20]}...")
        print(f"DEBUG: Hasil check_password_hash: {is_valid}")

        if is_valid:
            return user 
        
        return None

    @staticmethod
    def create(email, password):
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            hashed_password = generate_password_hash(password)
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(
                "INSERT INTO users (Email, Password, IsActive, created_at) VALUES (%s, %s, %s, %s)",
                (email, hashed_password, True, current_time)
            )
            conn.commit()
            user_id = cursor.lastrowid
            return user_id

        except Exception as e:
            conn.rollback() 
            print(f"Error Register: {e}")
            return None
        finally:
            cursor.close()
            conn.close()