import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';
import useFetchEmergencies from '../hooks/useFetchEmergencies'; // Custom hook to fetch emergencies
import Modal from '../components/Modal';
import { forwardGeocode } from '../utils/geolocationUtils';
import '../styles/SubmitReport.css';
import removeIcon from '../assets/cancel.png';

const SubmitReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { emergencies } = useFetchEmergencies(); // Fetch emergencies from backend

  const [formData, setFormData] = useState({
    emergencyType: location.state?.emergencyType || '', // Default to the selected emergency type if provided
    userId: user?._id,
    contactNumber: user?.phoneNumber || '',
    address: '',
    message: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch barangays based on user's city code
  useEffect(() => {
    const fetchBarangays = async () => {
      if (user?.address?.cityCode) {
        try {
          const barangayResponse = await fetch(
            `https://psgc.gitlab.io/api/cities-municipalities/${user.address.cityCode}/barangays/`
          );
          if (!barangayResponse.ok) {
            throw new Error('Failed to fetch barangays.');
          }
          const barangayData = await barangayResponse.json();
          const barangayNames = barangayData.map((barangay) => barangay.name);
          setBarangays(barangayNames);
        } catch (error) {
          console.error('Error fetching barangays:', error);
          setModalMessage('Failed to load barangays. Please try again later.');
          setShowModal(true);
        }
      } else {
        console.error('City code is missing in the user profile.');
        setModalMessage('City code is missing. Please contact support.');
        setShowModal(true);
      }
    };

    fetchBarangays();
  }, [user]);

  // Geocode the selected barangay and update the formData
  useEffect(() => {
    if (selectedBarangay && user?.address) {
      const normalizedCity = user.address.city.replace(/^City of\s+/i, '').trim();
      const fullAddress = `${selectedBarangay}, ${normalizedCity}, ${user.address.province}, ${user.address.country}`;
      
      forwardGeocode(fullAddress)
        .then(({ latitude, longitude }) => {
          setLatitude(latitude);
          setLongitude(longitude);
          setFormData((prevData) => ({
            ...prevData,
            address: fullAddress,
          }));
        })
        .catch((error) => {
          console.error('Geocoding error:', error);
          setModalMessage('Failed to determine the location. Please try again.');
          setShowModal(true);
        });
    }
  }, [selectedBarangay, user]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!latitude || !longitude || !selectedBarangay || !formData.emergencyType) {
      setModalMessage('Please fill out all required fields before submitting.');
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);
    const storedUser = localStorage.getItem('user');
    const token = storedUser ? JSON.parse(storedUser).token : null;

    try {
      let imageUrl = null;

      if (image) {
        const imageData = new FormData();
        imageData.append('file', image);
        imageData.append('upload_preset', 'ml_default'); // Ensure this matches your Cloudinary preset
      
        console.log('Image data being sent to Cloudinary:', imageData.get('file')); // Debug log
      
        const uploadRes = await fetch('https://api.cloudinary.com/v1_1/deeuurvsb/image/upload', {
          method: 'POST',
          body: imageData,
        });
      
        const uploadData = await uploadRes.json();
        console.log('Cloudinary response:', uploadData); // Debug log
      
        if (!uploadRes.ok) {
          throw new Error(uploadData.error?.message || 'Failed to upload image to Cloudinary');
        }
      
        imageUrl = uploadData.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl); // Debug log
      }

      const reportData = {
        emergencyId: location.state?.emergencyId, // Ensure this is passed from the frontend
        ...formData,
        latitude,
        longitude,
        imageURL: imageUrl, // Include the Cloudinary URL
        cloudinaryPublicId: imageUrl ? imageUrl.split('/').pop().split('.')[0] : null, // Extract public ID
      };
      
      console.log('Report data being sent:', reportData); // Debug log
      
      const response = await fetch('/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      console.log('Report data being sent:', reportData); // Debug log

      const result = await response.json();

      if (response.ok) {
        setModalMessage('Report submitted successfully!');
        setShowModal(true);
      } else {
        setModalMessage(result.error || 'Failed to submit the report.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setModalMessage('An error occurred while submitting the report.');
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file); // Debug log
      setImage(file);
  
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Close modal and navigate back to the dashboard
  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/UserDashboard');
  };

  return (
    <div className="submit-report-container">
      <h2>Submit Emergency Report</h2>
      <form onSubmit={handleSubmit} className="report-form">
        {/* Emergency Type Selection */}
        <div className="form-group">
          <label htmlFor="emergencyType">Emergency Type</label>
          <select
            id="emergencyType"
            value={formData.emergencyType}
            onChange={(e) =>
              setFormData((prevData) => ({ ...prevData, emergencyType: e.target.value }))
            }
            required
          >
            <option value="" disabled hidden>
              Select Emergency Type
            </option>
            {emergencies.map((emergency) => (
              <option key={emergency._id} value={emergency.type}>
                {emergency.type}
              </option>
            ))}
          </select>
        </div>

        {/* User Information */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" value={user?.userName} readOnly />
        </div>
        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number</label>
          <input type="tel" id="contactNumber" value={formData.contactNumber} readOnly />
        </div>

        {/* Address Selection */}
        <div className="form-group">
          <label htmlFor="address">Location of Emergency</label>
          <select
            id="address"
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              Select Barangay
            </option>
            {barangays.map((barangay, index) => (
              <option key={index} value={barangay}>
                {barangay}
              </option>
            ))}
          </select>
        </div>

        {/* Message Input */}
        <div className="form-group">
          <label htmlFor="message">Message (Optional)</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, message: e.target.value }))
            }
            placeholder="Describe the emergency..."
          ></textarea>
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <label htmlFor="image">Attach Image (Optional)</label>
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

        {/* Full-Screen Image Preview */}
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
              <img src={imagePreview} alt="Full screen preview" className="image-preview" />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      {/* Modal */}
      {showModal && (
        <Modal message={modalMessage} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default SubmitReport;
