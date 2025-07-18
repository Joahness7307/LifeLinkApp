import { useState } from "react";
import { useParams } from "react-router-dom";
import eyeIcon from "../assets/eye.png";
import eyeSlashIcon from "../assets/hidden.png";
import "../styles/ResetPassword.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MobileResetPassword = () => {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();

      const response = await fetch(`${BACKEND_URL}/api/password/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setMessage("Password reset successful. You can now open your app and log in.");
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
        <div className="reset-password-container">
            <form className="reset-password-form" onSubmit={handleSubmit}>
                <h2>Reset Password</h2>
                <div className="reset-password-input-group" style={{ position: "relative" }}>
                  <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                  />
                  <img
                      src={showPassword ? eyeSlashIcon : eyeIcon}
                      alt="Toggle Password Visibility"
                      className="reset-password-toggle-password-icon"
                      onClick={togglePasswordVisibility}
                      style={{
                        position: "absolute",
                        right: 20,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        width: 20,
                        height: 20
                      }}
                  />
                </div>
                <button type="submit">Reset Password</button>
                {message && <p className="reset-password-message">{message}</p>}
            </form>
        </div>
    );
};

export default MobileResetPassword;