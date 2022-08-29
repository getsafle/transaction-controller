const axios= require('axios');
const Web3 = require('web3');
const TokenController = require('@getsafle/custom-token-controller');

const events = require('../events');
const sigs = require('../function-signatures');
const ABIs = require('../function-abis');
const oldNFTContracts = require('../utils/old-nft-contracts');

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
    let url =  `https://api.unmarshal.com/v2/matic`;

    return { url };
  }
  if (network === 'bsc-mainnet') {
    let url =  `https://api.bscscan.com`;

    return { url };
  }
  if(network === 'avalanche-mainnet') {
    let url =`https://api.snowtrace.io`;

    return { url };
  }
  if(network === 'bitcoin') {
    let url =`https://blockchain.info/rawaddr`;

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

  const decodedLogs = events.abiDecoder.decodeLogs(logs);

  decodedLogs.forEach((txs) => {
    let parameters = []
    eventParams.push({ name: txs.name, parameters });
    txs.events.forEach((parameter) => {
      eventParams[eventParams.length - 1].parameters.push({ name: parameter.name, value: parameter.value, type: parameter.type });
    });
  })

  return eventParams;
}

async function extractNFTLogs(transactionHash, web3) {
  await addABI([ABIs.erc721ABI]);

  let eventParams = [];

  const { logs, to } = await web3.eth.getTransactionReceipt(transactionHash);

  if (oldNFTContracts[web3.utils.toChecksumAddress(to)] !== undefined) {
    await addABI([ABIs[oldNFTContracts[web3.utils.toChecksumAddress(to)]]]);
  }

  const decodedLogs = events.abiDecoder.decodeLogs(logs);

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

  if (sigs[signature] === undefined) {
      functionName = signature;
  } else {
      functionName = sigs[signature];
  }

  return functionName;
}

async function extractTokenTransferDetails(input, to, rpcUrl, from, functionName) {
  await addABI([ABIs.erc20ABI]);

  const decodedData = events.abiDecoder.decodeMethod(input);

  const tokenController = new TokenController.CustomTokenController({ rpcURL: rpcUrl });

  const tokenDetails = await tokenController.getTokenDetails(to);

  let output;

  switch (functionName) {

    case 'Transfer':
      output = {
        from,
        tokenSymbol: tokenDetails.symbol,
        recepient: decodedData.params[0].value,
        value: decodedData.params[1].value/10**parseInt(tokenDetails.decimal),
      }

      break;

    case 'Transfer From':
      output = {
        operator: from,
        from: decodedData.params[0].value,
        tokenSymbol: tokenDetails.symbol,
        recepient: decodedData.params[1].value,
        value: decodedData.params[2].value/10**parseInt(tokenDetails.decimal),
      }

      break;

  }

  return output;
}

async function extractTokenSwapDetails(functionName, input, transactionHash, rpcUrl) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  const tokenController = new TokenController.CustomTokenController({ rpcURL: rpcUrl });

  await addABI([ABIs.swapABI1, ABIs.swapABI2, ABIs.swapABI3, ABIs.swapABI4, ABIs.swapABI5, ABIs.swapABI6]);

  const decodedData = events.abiDecoder.decodeMethod(input);

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

async function extractNFTTransferDetails(input, functionName, contractAddress, from, web3) {
  await addABI([ABIs.erc721ABI]);

  const decodedData = events.abiDecoder.decodeMethod(input);

  let output;

  if (oldNFTContracts[web3.utils.toChecksumAddress(contractAddress)] !== undefined) {
    output = await getOldNFTContractOutput(decodedData, functionName, from);
  } else {
    switch (functionName) {
  
      case 'Transfer':
        output = {
          from,
          recepient: decodedData.params[1].value,
          tokenId: decodedData.params[2].value,
        }
  
        break;
      
      case 'Transfer From':
        output = {
          from: decodedData.params[0].value,
          recepient: decodedData.params[1].value,
          tokenId: decodedData.params[2].value,
        }
  
        break;
  
      case 'Safe Transfer From':
        output = {
          from: decodedData.params[0].value,
          recepient: decodedData.params[1].value,
          tokenId: decodedData.params[2].value,
        }
  
        break;

    }
  }

  return output;
}

async function getOldNFTContractOutput(decodedData, functionName, from) {
  let output;

  switch(functionName) {

    case 'Transfer Punk':
      output = {
        from,
        recepient: decodedData.params[0].value,
        tokenId: decodedData.params[1].value,
      }

      break;

    case 'Transfer':
      output = {
        from,
        recepient: decodedData.params[0].value,
        tokenId: decodedData.params[1].value,
      }

      break;

  }

  return output;
}

async function isNFT(contractAddress, rpcUrl) {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const erc20Instance = new web3.eth.Contract(ABIs.erc20ABI, contractAddress);
  const erc721Instance = new web3.eth.Contract(ABIs.erc721ABI, contractAddress);

  let isERC20;
  let isERC721;
  let status;

  try {
    await erc20Instance.methods.decimals().call();

    isERC20 = true;
  } catch (error) {
    isERC20 = false;
  }

  try {
    await erc721Instance.methods.isApprovedForAll('0x617F2E2fD72FD9D5503197092aC168c91465E7f2', '0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C').call();

    isERC721 = true
  } catch (error) {
    isERC721 = false;
  }

  isERC721 = (isERC721 === false && oldNFTContracts[web3.utils.toChecksumAddress(contractAddress)] !== undefined) ? true : isERC721;

  if (!isERC721 && !isERC20) {
    status = false;
  } else {
    status = isERC721;
  }

  return status;
}

async function addABI(abiArray) {
  abiArray.forEach(abi => {
    events.abiDecoder.addABI(abi);
  });

  return true;
}

module.exports = {
  getRequest,
  getURL,
  isEOA,
  extractLogs,
  extractFunctionName,
  extractTokenTransferDetails,
  extractTokenSwapDetails,
  extractNFTTransferDetails,
  isNFT,
  extractNFTLogs,
};