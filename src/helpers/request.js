const axios = require('axios');

module.exports = {
    postRequest: async (url, data, token) => {
        return axios.post(url, data, { headers: { Authorization: `Bearer ${token}` } });
    }
};
