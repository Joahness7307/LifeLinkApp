import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;
export const WEB_RESET_URL = Constants.expoConfig.extra.webResetUrl;

// Example:
console.log("API URL:", API_BASE_URL);
console.log("Web Reset URL:", WEB_RESET_URL);