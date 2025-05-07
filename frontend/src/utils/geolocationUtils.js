export const getLocation = (onSuccess, onError) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Latitude:', latitude, 'Longitude:', longitude);
        if (onSuccess) onSuccess(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        if (onError) onError(error);
      },
      { enableHighAccuracy: true } // Request high accuracy
    );
  } else {
    alert('Geolocation is not supported by your browser.');
  }
};

export const forwardGeocode = async (address) => {
  // console.log('Forward geocoding address:', address);
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  );
  const data = await response.json();
  if (data.length > 0) {
    const { lat, lon } = data[0];
    // console.log('Forward Geocoded Latitude:', lat, 'Longitude:', lon);
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
  } else {
    console.error('Address not found:', address);
    throw new Error('Address not found');
  }
};