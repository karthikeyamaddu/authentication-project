import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [rollnumber, setRollnumber] = useState('');
  const [qrCodePath, setQrCodePath] = useState('');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [key, setKey] = useState(''); // To store the OTP secret key

  const handleGenerateQr = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/generate_qr', {
        username,
        rollnumber
      });

      // Handle the response from the backend
      setMessage(response.data.message);
      setQrCodePath(response.data.qr_code_path);
      setKey(response.data.key); // Save the secret key for OTP verification
    } catch (error) {
      console.error('Error generating QR:', error);
      setMessage('Error generating QR code.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/verify_otp', {
        username,
        rollnumber,
        otp
      });

      // Handle the OTP verification response
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setMessage('Error verifying OTP.');
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>2FA Authentication</h1>

        <form onSubmit={handleGenerateQr}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          <input
            type="text"
            value={rollnumber}
            onChange={(e) => setRollnumber(e.target.value)}
            placeholder="Enter your roll number"
            required
          />
          <button type="submit">Generate QR Code</button>
        </form>

        {message && <p className="message">{message}</p>}

        {qrCodePath && (
          <div className="qr-container">
            <img src={qrCodePath} alt="QR Code" />
          </div>
        )}

        {qrCodePath && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP from Google Authenticator"
              required
            />
            <button type="submit">Verify OTP</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
