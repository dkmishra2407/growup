import axios from 'axios';

const TWELVE_DATA_API_KEY = 'YOUR_API_KEY'; // Replace with actual API key
const BASE_URL = 'https://api.twelvedata.com';

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    apikey: TWELVE_DATA_API_KEY,
  },
});

export const getStockPrice = async (symbol: string) => {
  const response = await api.get('/price', {
    params: { symbol },
  });
  return response.data;
};

export const getStockQuote = async (symbol: string) => {
  const response = await api.get('/quote', {
    params: { symbol },
  });
  return response.data;
};

export const getTimeSeriesData = async (symbol: string, interval = '1day') => {
  const response = await api.get('/time_series', {
    params: { symbol, interval },
  });
  return response.data;
};