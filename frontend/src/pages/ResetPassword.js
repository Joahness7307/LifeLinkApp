import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ResetPassword.css";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
  
      const response = await fetch(`http://localhost:3000/password/reset-password/${token}`, { // Send token in URL
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }), // Only send newPassword in body
      });
  
      const data = await response.json();
      setMessage(data.message);
  
      if (response.ok) navigate("/login");
  };

    return (
        <div className="reset-password-container">
            <form className="reset-password-form" onSubmit={handleSubmit}>
                <h2>Reset Password</h2>
                <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Reset Password</button>
                {message && <p className="reset-password-message">{message}</p>}
            </form>
        </div>
    );
};

export default ResetPassword;
