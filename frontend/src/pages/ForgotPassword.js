import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch("http://localhost:3000/password/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        setMessage(data.message);
        setShowPopup(true); // Show the popup after submitting
    };

    return (
                <div className="forgot-password-container">
                    <h2>Forgot Password</h2>
                    <p className="forgot-password-text">Enter your email to receive a password reset link.</p>
                    <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        <button type="submit">Send Reset Link</button>
                    </form>
                    <p>
                        Remember your password? <Link to="/login">Login</Link>
                    </p>
                

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>{message}</p>
                        <button onClick={() => setShowPopup(false)} className="auth-button">OK</button>
                    </div>
                </div>
            )}
            </div>
    );
};

export default ForgotPassword;
