import os
import pyotp
import qrcode
from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS  # Import CORS

app = Flask(__name__)

# Enable CORS for all domains (if needed, you can restrict to specific domains)
CORS(app)

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017/')
db = client['auth_system']
users_collection = db['users']

# API endpoint to handle user registration, QR generation, and OTP verification
@app.route('/api/generate_qr', methods=['POST'])
def generate_qr():
    data = request.get_json()
    username = data['username']
    rollnumber = data['rollnumber']
    
    # Check if user exists
    user = users_collection.find_one({"rollnumber": rollnumber, "username": username})
    
    if user:
        # Use existing secret key
        key = user['secret_key']
        message = "Using saved secret key"
    else:
        # Generate a new secret key for the user
        key = pyotp.random_base32()
        users_collection.insert_one({
            "username": username,
            "rollnumber": rollnumber,
            "secret_key": key
        })
        message = "New secret key generated and saved"
    
    # Generate the provisioning URI and QR code
    totp_auth_uri = pyotp.TOTP(key).provisioning_uri(name=username, issuer_name="Your_App_Name")
    qr_code_path = "static/qr_code.png"
    qrcode.make(totp_auth_uri).save(qr_code_path)
    
    return jsonify({
        "message": message,
        "qr_code_path": qr_code_path,
        "key": key  # Return the key so it can be used for OTP verification
    })

# API endpoint for OTP verification
@app.route('/api/verify_otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    username = data['username']
    rollnumber = data['rollnumber']
    user_otp = data['otp']
    
    # Retrieve the user's secret key from the database
    user = users_collection.find_one({"rollnumber": rollnumber, "username": username})
    
    if user:
        key = user['secret_key']
        totp = pyotp.TOTP(key)
        
        # Verify the OTP
        if totp.verify(user_otp):
            return jsonify({"message": "Authentication successful!"})
        else:
            return jsonify({"message": "Authentication failed!"})
    else:
        return jsonify({"message": "User not found!"})

if __name__ == '__main__':
    app.run(debug=True)
