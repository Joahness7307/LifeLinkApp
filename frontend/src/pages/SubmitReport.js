import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useFetchUser from '../hooks/useFetchUser';
import Modal from '../components/Modal';
import '../styles/SubmitReport.css';
import removeIcon from '../assets/cancel.png';

const SubmitReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { emergencyId, emergencyType, userId } = location.state;
  const { user } = useFetchUser(userId);
  // const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [formData, setFormData] = useState({
    emergencyId: emergencyId,
    userId: userId,
    contactNumber: user?.phoneNumber || '',
    address: user?.address || '',
    message: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  // const [fileInfo, setFileInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      console.error("userId is undefined in SubmitReport");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('emergencyId', formData.emergencyId);
    formDataToSend.append('userId', formData.userId);
    formDataToSend.append('contactNumber', formData.contactNumber);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('message', formData.message);
    if (image) {
      formDataToSend.append('image', image);
    }

    try {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const token = parsedUser ? parsedUser.token : null;

      const response = await fetch('/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const responseData = await response.json();

      if (response.ok) {
        setModalMessage('Emergency report submitted successfully!');
        setShowModal(true);
      } else {
        console.error('Failed to submit the report:', responseData.error);
        setModalMessage(`Failed to submit the report: ${responseData.error}`);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setModalMessage('An error occurred. Please try again.');
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/emergencies');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      
      // Create preview URL but don't show it immediately
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
    // setFileInfo(null);
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
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder="Describe the emergency situation..."
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Attach Image (Optional):</label>
          <div className="file-input-container">
            {image ? (
              <>
                <span 
                  className="file-name"
                  onClick={() => setShowFullScreen(true)}
                >
                  {image.name}
                </span>
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={removeImage}
                >
                  <img 
                    src={removeIcon} 
                    alt="Remove" 
                    className="remove-icon"
                  />
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
        <button type="submit" className="submit-btn">Submit Report</button>
      </form>
      {showModal && <Modal message={modalMessage} onClose={handleCloseModal} />}

      {/* Full Screen Image Modal */}
      {showFullScreen && imagePreview && (
        <div 
          className="fullscreen-modal"
          onClick={() => setShowFullScreen(false)}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              className="modal-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullScreen(false);
              }}
            >
              <img 
                src={removeIcon} 
                alt="Close" 
                className="modal-close-icon"
              />
            </button>
            <img 
              src={imagePreview} 
              alt="Full screen preview" 
              className="fullscreen-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;