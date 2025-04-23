import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import '../styles/Signup.css';
import eyeIcon from '../assets/eye.png';
import eyeSlashIcon from '../assets/hidden.png';
import { getLocation, forwardGeocode } from '../utils/geolocationUtils';

const Signup = () => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState(''); // Initialize as an empty string
  const [agencyId, setAgencyId] = useState(''); // For responders
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { signup, error, isLoading } = useSignup();
  const navigate = useNavigate();

  // Address dropdown states
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

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    // Fetch countries (static or from an API)
    setCountries([{ name: 'Philippines', code: 'PH' }]); // Example: Static country
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      // Fetch regions based on selected country
      fetch(`https://psgc.gitlab.io/api/regions/`)
        .then((res) => res.json())
        .then((data) => setRegions(data));
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedRegion) {
      // Fetch provinces based on selected region
      fetch(`https://psgc.gitlab.io/api/regions/${selectedRegion}/provinces/`)
        .then((res) => res.json())
        .then((data) => setProvinces(data));
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvince) {
      // Fetch cities/municipalities based on selected province
      fetch(`https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`)
        .then((res) => res.json())
        .then((data) => setCities(data));
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
      // Fetch barangays based on selected city/municipality
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
  
    try {
      // Normalize the city name by removing "City of" if it exists
      const normalizedCity = address.city.replace(/^City of\s+/i, '').trim();
      console.log('City Name in Signup.js:', normalizedCity);

      // Simplify the address for forward geocoding
      const simplifiedAddress = `${address.barangay}, ${normalizedCity}, ${address.province}, ${address.country}`;
      console.log('Forward geocoding address:', simplifiedAddress);

      const { latitude, longitude } = await forwardGeocode(simplifiedAddress);

      console.log('Barangay Coordinates:', latitude, longitude);

      const success = await signup(
        userName,
        email,
        password,
        phoneNumber,
        address,
        role,
        agencyId,
        latitude,
        longitude
      );

      if (success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error during forward geocoding or signup:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container-signup-page">
      <div className="auth-content">
        <div className="auth-card">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="userName"
                required
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'} // Toggle input type
                name="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <img
                src={showPassword ? eyeSlashIcon : eyeIcon} // Toggle icon
                alt="Toggle Password Visibility"
                className="toggle-password-icon"
                onClick={togglePasswordVisibility}
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                name="phoneNumber"
                required
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            {/* Address Dropdowns */}
            <div className="input-group">
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
            <div className="input-group">
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
            <div className="input-group">
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
            <div className="input-group">
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
            <div className="input-group">
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
            <div className="input-group">
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required // Ensure the user selects a role
              >
                <option value="" disabled hidden>
                  Select Role
                </option>
                <option value="user">User</option>
                <option value="responder">Responder</option>
              </select>
            </div>
            {role === 'responder' && (
              <div className="input-group">
                <input
                  type="text"
                  name="agencyId"
                  required
                  placeholder="Agency ID"
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                />
              </div>
            )}
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
            {error && <div className="error">{error}</div>}
          </form>
          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;