const axios = require('axios')
const ENDPOINT_URL = 'https://backend-salepage.herokuapp.com/'
//const ENDPOINT_URL = 'http://localhost:3500/'
const instance = axios.create({
    baseURL: ENDPOINT_URL,
    timeout: 1000,
    headers: {'Content-Type': 'application/json'}
});

module.exports = instance;

