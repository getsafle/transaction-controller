const axios= require('axios');
const Web3 = require('web3');
const Controller = require('@getsafle/custom-token-controller');

const abiDecoder = require('../events');
const sigs = require('../function-signatures');
const ABIs = require('../function-abis');

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
  abiDecoder.addABI(ABIs.transferABI);

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

async function extractTokenSwapDetails(functionName, input, transactionHash, rpcUrl) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  const tokenController = new Controller.CustomTokenController({ rpcURL: rpcUrl });


  abiDecoder.addABI(ABIs.swapABI1);
  abiDecoder.addABI(ABIs.swapABI2);
  abiDecoder.addABI(ABIs.swapABI3);
  abiDecoder.addABI(ABIs.swapABI4);
  abiDecoder.addABI(ABIs.swapABI5);
  abiDecoder.addABI(ABIs.swapABI6);

  const decodedData = abiDecoder.decodeMethod(input);

  const logs = await this.extractLogs(transactionHash, web3);

  const transferLogs = logs.filter(log => log.name === 'Transfer');

  let output;

  switch (functionName) {

    case 'Swap Exact ETH For Tokens': 
      srcTokenDetails = await tokenController.getTokenDetails(decodedData.params[1].value[0]);
      dstTokenDetails = await tokenController.getTokenDetails(decodedData.params[1].value[decodedData.params[1].value.length - 1]);

      output = {
        srcToken: (srcTokenDetails.symbol === 'WETH') ? 'ETH' : srcTokenDetails.symbol,
        srcTokenContractAddress: (srcTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[1].value[0],
        srcAmount: web3.utils.fromWei(transferLogs[0].parameters[2].value, 'ether'),
        destToken: dstTokenDetails.symbol,
        destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstTokenDetails.decimal),
        destTokenContractAddress: (dstTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[1].value[decodedData.params[1].value.length - 1],
      }

      break;

    case 'Swap Exact Tokens For ETH':
      srcTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[0]);
      dstTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[decodedData.params[2].value.length - 1]);
    
      output = {
        srcTokenContractAddress: (srcTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[0],
        srcToken: srcTokenDetails.symbol,
        srcAmount: decodedData.params[0].value/10**parseInt(srcTokenDetails.decimal),
        destToken: (dstTokenDetails.symbol === 'WETH') ? 'ETH' : dstTokenDetails.symbol,
        destTokenContractAddress: (dstTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        destAmount: parseFloat(web3.utils.fromWei(transferLogs[transferLogs.length - 1].parameters[2].value, 'ether')),
      }

      break;

      case 'Swap Exact Tokens For Tokens':
        srcTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[0]);
        dstTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[decodedData.params[2].value.length - 1]);

        output = {
          srcToken: (srcTokenDetails.symbol === 'WETH') ? 'ETH' : srcTokenDetails.symbol,
          srcTokenContractAddress: (srcTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcTokenDetails.decimal),
          destToken: (dstTokenDetails.symbol === 'WETH') ? 'ETH' : dstTokenDetails.symbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstTokenDetails.decimal),
          destTokenContractAddress: (dstTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        }

        break;
      
      case 'Swap Tokens For Exact Tokens':
        srcTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[0]);
        dstTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[decodedData.params[2].value.length - 1]);

        output = {
          srcToken: (srcTokenDetails.symbol === 'WETH') ? 'ETH' : srcTokenDetails.symbol,
          srcTokenContractAddress: (srcTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcTokenDetails.decimal),
          destToken: (dstTokenDetails.symbol === 'WETH') ? 'ETH' : dstTokenDetails.symbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstTokenDetails.decimal),
          destTokenContractAddress: (dstTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        }

        break;

      case 'Swap ETH For Exact Tokens':
        srcTokenDetails = await tokenController.getTokenDetails(decodedData.params[1].value[0]);
        dstTokenDetails = await tokenController.getTokenDetails(decodedData.params[1].value[decodedData.params[1].value.length - 1]);

        output = {
          srcToken: (srcTokenDetails.symbol === 'WETH') ? 'ETH' : srcTokenDetails.symbol,
          srcTokenContractAddress: (srcTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcTokenDetails.decimal),
          destToken: (dstTokenDetails.symbol === 'WETH') ? 'ETH' : dstTokenDetails.symbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstTokenDetails.decimal),
          destTokenContractAddress: (dstTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[1].value[decodedData.params[1].value.length - 1],
        }

        break;

      case 'Swap Tokens For Exact ETH':
        srcTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[0]);
        dstTokenDetails = await tokenController.getTokenDetails(decodedData.params[2].value[decodedData.params[2].value.length - 1]);

        output = {
          srcToken: (srcTokenDetails.symbol === 'WETH') ? 'ETH' : srcTokenDetails.symbol,
          srcTokenContractAddress: (srcTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[0],
          srcAmount: transferLogs[0].parameters[2].value/10**parseInt(srcTokenDetails.decimal),
          destToken: (dstTokenDetails.symbol === 'WETH') ? 'ETH' : dstTokenDetails.symbol,
          destAmount: transferLogs[transferLogs.length - 1].parameters[2].value/10**parseInt(dstTokenDetails.decimal),
          destTokenContractAddress: (dstTokenDetails.symbol === 'WETH') ? undefined : decodedData.params[2].value[decodedData.params[2].value.length - 1],
        }

        break;
  }

  return output;
}

module.exports = { getRequest, getURL, isEOA, extractLogs, extractFunctionName, extractTokenTransferDetails, extractTokenSwapDetails };