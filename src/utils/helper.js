const axios= require('axios')
async function getRequest({ url }) {
    try {
      const response = await axios({
          url,
          method: 'GET',
      });
  
      return { response: response.data };
    } catch (error) {
      return { error: error.response };
    }
}
  
module.exports = { getRequest };