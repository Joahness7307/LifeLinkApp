import axios from 'axios';
import Constants from 'expo-constants';

const OPENCAGE_API_KEY = Constants.expoConfig.extra.OPENCAGE_API_KEY;

export const forwardGeocode = async (address) => {
  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}&language=en&pretty=1`
    );

    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        formatted: result.formatted,
      };
    } else {
      throw new Error('No geocoding result found.');
    }
  } catch (error) {
    console.error('OpenCage Geocoding Error:', error.message);
    return null;
  }
};
