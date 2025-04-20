import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';
import Modal from '../components/Modal'; // Import the Modal component
import '../styles/SubmitReport.css';
import removeIcon from '../assets/cancel.png';

const SubmitReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { emergencyId, emergencyType } = location.state; // Get emergency details from UserDashboard
  const { user } = useAuthContext(); // Get user details from context

  const [formData, setFormData] = useState({
    emergencyId: emergencyId,
    userId: user?._id,
    contactNumber: user?.phoneNumber || '',
    address: user?.address || '',
    message: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showModal, setShowModal] = useState(false); // State to control the modal
  const [modalMessage, setModalMessage] = useState(''); // State for the modal message

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contactNumber || !formData.address) {
      alert('Please provide a valid contact number and address.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('emergencyId', formData.emergencyId);
    formDataToSend.append('userId', formData.userId);
    formDataToSend.append('contactNumber', formData.contactNumber);
    formDataToSend.append('address', formData.address);
    if (formData.message) {
      formDataToSend.append('message', formData.message);
    }
    if (image) {
      formDataToSend.append('image', image);
    }

    try {
      const storedUser = localStorage.getItem('user');
      const token = storedUser ? JSON.parse(storedUser).token : null;

      const response = await fetch('/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      // Show the modal with a success message
      setModalMessage('Your report has been submitted successfully!');
      setShowModal(true);
    } catch (error) {
      console.error('Failed to submit the report:', error);
      setModalMessage(`Error: ${error.message}`);
      setShowModal(true); // Show the modal with an error message
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/UserDashboard'); // Redirect to the UserDashboard after closing the modal
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="submit-report-container">
      <h2>Submit Emergency Report</h2>
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label>Type:</label>
          <input type="text" value={emergencyType} readOnly />
        </div>
        <div className="form-group">
          <label>Username:</label>
          <input type="text" value={user.userName} readOnly />
        </div>
        <div className="form-group">
          <label>Contact Number:</label>
          <input type="text" value={user.phoneNumber} readOnly />
        </div>
        <div className="form-group">
          <label>Address:</label>
          <input type="text" value={user.address} readOnly />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message (Optional):</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Describe the emergency situation..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Attach Image (Optional):</label>
          <small className="file-size-label">Maximum file size: 5MB</small>
          <div className="file-input-container">
            {image ? (
              <>
                <span className="file-name" onClick={() => setShowFullScreen(true)}>
                  {image.name}
                </span>
                <button type="button" className="remove-image-btn" onClick={removeImage}>
                  <img src={removeIcon} alt="Remove" className="remove-icon" />
                </button>
              </>
            ) : (
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
            )}
          </div>
        </div>
        <button type="submit" className="submit-btn">
          Submit Report
        </button>
      </form>
      {showModal && <Modal message={modalMessage} onClose={handleCloseModal} />}

      {showFullScreen && imagePreview && (
        <div className="fullscreen-modal" onClick={() => setShowFullScreen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullScreen(false);
              }}
            >
              <img src={removeIcon} alt="Close" className="modal-close-icon" />
            </button>
            <img src={imagePreview} alt="Full screen preview" className="fullscreen-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;