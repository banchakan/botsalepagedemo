const axios = require('axios')
const ENDPOINT_URL = 'https://api.dudee-shop.com/v1/'
//const ENDPOINT_URL = 'http://localhost:3500/'
const instance = axios.create({
    baseURL: ENDPOINT_URL,
    timeout: 5000,
    headers: {'Content-Type': 'application/json'}
});

module.exports = instance;

