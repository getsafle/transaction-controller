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
 
async function getURL(network){
  if(network === 'polygon-mainnet'){

   let url =  `https://api.polygonscan.com`;

    return { url };
  }
  else{
    const etherscanSubdomain =
      network === 'mainnet' ? 'api' : `api-${network}`;

     url = `https://${etherscanSubdomain}.etherscan.io`;

    return { url };
  }
}

module.exports = { getRequest, getURL };