import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';
import '../styles/CompleteProfile.css'; // Import the new styles

const CompleteProfile = () => {
  const [contactNumber, setContactNumber] = useState('');
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const { user, dispatch } = useAuthContext();

  const navigate = useNavigate();

  // Fetch countries (static or from an API)
  useEffect(() => {
    setCountries([{ name: 'Philippines', code: 'PH' }]); // Example: Static country
  }, []);

  // Fetch regions based on selected country
  useEffect(() => {
    if (selectedCountry) {
      fetch(`https://psgc.gitlab.io/api/regions/`)
        .then((res) => res.json())
        .then((data) => setRegions(data));
    }
  }, [selectedCountry]);

  // Fetch provinces based on selected region
  useEffect(() => {
    if (selectedRegion) {
      fetch(`https://psgc.gitlab.io/api/regions/${selectedRegion}/provinces/`)
        .then((res) => res.json())
        .then((data) => setProvinces(data));
    }
  }, [selectedRegion]);

  // Fetch cities/municipalities based on selected province
  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`)
        .then((res) => res.json())
        .then((data) => setCities(data));
    }
  }, [selectedProvince]);

  // Fetch barangays based on selected city/municipality
  useEffect(() => {
    if (selectedCity) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${selectedCity}/barangays/`)
        .then((res) => res.json())
        .then((data) => setBarangays(data));
    }
  }, [selectedCity]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const address = {
      country: countries.find((country) => country.code === selectedCountry)?.name || '',
      region: regions.find((region) => region.code === selectedRegion)?.name || '',
      province: provinces.find((province) => province.code === selectedProvince)?.name || '',
      city: cities.find((city) => city.code === selectedCity)?.name || '',
      cityCode: selectedCity, // Explicitly include the cityCode
      barangay: barangays.find((barangay) => barangay.code === selectedBarangay)?.name || '',
      barangayCode: selectedBarangay, // Explicitly include the barangayCode
    };

    console.log('Address:', address);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/user/complete-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contactNumber, address }),
    });

    if (response.ok) {
      // Update the user's profile completion status in AuthContext
      dispatch({
        type: 'LOGIN',
        payload: { ...user, isProfileComplete: true },
      });
      navigate('/UserDashboard'); // Redirect to the dashboard
    } else {
      alert('Failed to complete profile. Please try again.');
    }
  };

  return (
    <div className="complete-profile-container">
       {/* Banner or Message */}
       <div className="complete-profile-banner">
        <p>Welcome! Please complete your profile to access your dashboard.</p>
      </div>
      
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="complete-profile-input-group">
          <input
            type="text"
            id="contactNumber"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
            placeholder="Contact Number"
          />
        </div>

        {/* Address Dropdowns */}
        <div className="complete-profile-input-group">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              Select Country
            </option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="complete-profile-input-group">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              Select Region
            </option>
            {regions.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
        <div className="complete-profile-input-group">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              Select Province
            </option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>
        <div className="complete-profile-input-group">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              Select City/Municipality
            </option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        <div className="complete-profile-input-group">
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              Select Barangay
            </option>
            {barangays.map((barangay) => (
              <option key={barangay.code} value={barangay.code}>
                {barangay.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="complete-profile-submit-button">
          Complete Profile
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;