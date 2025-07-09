import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const useAddressSelection = () => {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  // Fetch regions from backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/address/regions`)
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch((error) => console.error('Error fetching regions:', error));
  }, []);

  // Fetch provinces based on selected region
  useEffect(() => {
    if (selectedRegion) {
      fetch(`${BACKEND_URL}/api/address/provinces/${selectedRegion}`)
        .then((res) => res.json())
        .then((data) => setProvinces(data))
        .catch((error) => console.error('Error fetching provinces:', error));
    } else {
      setProvinces([]);
    }
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedBarangay('');
    setCities([]);
    setBarangays([]);
  }, [selectedRegion]);

  // Fetch cities based on selected province
  useEffect(() => {
    if (selectedProvince) {
      fetch(`${BACKEND_URL}/api/address/cities/${selectedProvince}`)
        .then((res) => res.json())
        .then((data) => setCities(data))
        .catch((error) => console.error('Error fetching cities:', error));
    } else {
      setCities([]);
    }
    setSelectedCity('');
    setSelectedBarangay('');
    setBarangays([]);
  }, [selectedProvince]);

  // Fetch barangays from PSGC API (since you may not have them in your DB)
  useEffect(() => {
    if (selectedCity) {
      // Find the selected city object to get its PSGC code
      const cityObj = cities.find(city => city._id === selectedCity);
      const cityCode = cityObj ? cityObj.code : null;
  
      if (cityCode) {
        fetch(`https://psgc.gitlab.io/api/cities/${cityCode}/barangays/`)
          .then((res) => res.json())
          .then((data) => setBarangays(data))
          .catch((error) => console.error('Error fetching barangays:', error));
      } else {
        setBarangays([]);
      }
    } else {
      setBarangays([]);
    }
    setSelectedBarangay('');
  }, [selectedCity, cities]);

  return {
    regions,
    provinces,
    cities,
    barangays,
    selectedRegion,
    setSelectedRegion,
    selectedProvince,
    setSelectedProvince,
    selectedCity,
    setSelectedCity,
    selectedBarangay,
    setSelectedBarangay,
  };
};

export default useAddressSelection;