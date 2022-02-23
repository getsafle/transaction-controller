const axios= require('axios');
const Controller = require('@getsafle/custom-token-controller');

const abiDecoder = require('../events');
const sigs = require('../function-signatures');
const transferABI = require('../constants/transfer-abi');

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
 
async function getURL(network) {
  if (network === 'polygon-mainnet') {
    let url =  `https://api.polygonscan.com`;

    return { url };
  }
  else {
    const etherscanSubdomain = network === 'mainnet' ? 'api' : `api-${network}`;

    url = `https://${etherscanSubdomain}.etherscan.io`;

    return { url };
  }
}

async function isEOA(address, web3) {
    const isEOA = await web3.eth.getCode(address);
    
    if(isEOA === '0x') {
        return true;
    }

    return false;
}

async function extractLogs(transactionHash, web3) {
    let eventParams = [];
5
    const { logs } = await web3.eth.getTransactionReceipt(transactionHash);

    const decodedLogs = abiDecoder.decodeLogs(logs);

    decodedLogs.forEach((txs) => {
        let parameters = []
        eventParams.push({ name: txs.name, parameters });
        txs.events.forEach((parameter) => {
            eventParams[eventParams.length - 1].parameters.push({ name: parameter.name, value: parameter.value, type: parameter.type });
        });
    })

    return eventParams;
}

async function extractFunctionName(input) {
    let functionName;

    const signature = input.substring(0, 10);

    if (sigs[signature] === 'undefined') {
        functionName = signature;
    } else {
        functionName = sigs[signature];
    }

    return functionName;
}

async function extractTokenTransferDetails(input, to, rpcUrl) {
    abiDecoder.addABI(transferABI);

    const decodedData = abiDecoder.decodeMethod(input);

    const tokenController = new Controller.CustomTokenController({ rpcURL: rpcUrl });

    const tokenDetails = await tokenController.getTokenDetails(to);

    const output = {
      tokenSymbol: tokenDetails.symbol,
      recepient: decodedData.params[0].value,
      value: decodedData.params[1].value/10**parseInt(tokenDetails.decimal),
    }

    return output;
}

module.exports = { getRequest, getURL, isEOA, extractLogs, extractFunctionName, extractTokenTransferDetails };