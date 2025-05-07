export const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
  );
  const data = await response.json();
  // console.log('Address:', data.display_name);
  return data.display_name;
};