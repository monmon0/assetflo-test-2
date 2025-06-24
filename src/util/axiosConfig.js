import axios from 'axios';
import variables from '../variables.json';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || variables.BASE_URL,
  headers: {
    Accept: 'application/json'
  }
});

export const setAuthToken = (token) => {
  if (token) {
    // Apply to every request
    instance.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    // Delete auth header
    delete instance.defaults.headers.common['Authorization'];
  }
};

export default instance;
