const Web3 = require('web3');
const SafleId = require('@getsafle/safle-identity-wallet').SafleID;

const Helper = require('./utils/helper');
const { networks } = require('./constants');
const { INVALID_NETWORK_ERROR } = require('./constants/responses');

class TransactionController {

  async getIncomingTransactions({ address, fromBlock, network, apiKey }) {
    const transactionsList = await this.getTransactions({ address, fromBlock, network, apiKey });

    let incomingTransactions = [];

    transactionsList.forEach(element => {
      if (element['to'] === address.toLowerCase()) {
        incomingTransactions.push(element);
      }
    });

    return incomingTransactions;
  }

  async getOutgoingTransactions({ address, fromBlock, network, apiKey }) {
    const transactionsList = await this.getTransactions({ address, fromBlock, network, apiKey });

    let outgoingTransactions = [];

    transactionsList.forEach(element => {
      if (element['from'] === address.toLowerCase()) {
        outgoingTransactions.push(element);
      }
    });

    return outgoingTransactions;
  }

  async getTransactions({ address, fromBlock, network, apiKey }) {
    if (!networks.includes(network)) {
      return INVALID_NETWORK_ERROR;
    }

    const {url: apiUrl} = await Helper.getURL(network);

    let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&apikey=${apiKey}`;

    if (fromBlock) {
      url += `&startBlock=${parseInt(fromBlock, 10)}`;
    }

    const { response } = await Helper.getRequest({ url });

    const { status, result } = response;

    if (status === '1' && result.length > 0) {
      result.sort((a, b) => (a.timeStamp < b.timeStamp ? -1 : 1));
    }

    return result;
  }

  async analyzeTransaction(transactionHash, rpcUrl, network) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    const safleId = new SafleId(network);

    let txType;

    const { to, value, from, input, blockNumber } = await web3.eth.getTransaction(transactionHash);
    
    const { timestamp } = await web3.eth.getBlock(blockNumber);

    const isEOA = await Helper.isEOA(to, web3);

    if (isEOA) {
      txType = 'native-asset-transfer';

      const id = await safleId.getSafleId(to);

      const output = { from, value: web3.utils.fromWei(value, 'ether'), txType, safleId: id, to, timeStamp: timestamp }

      return output;
    }

    let txParams;
    let id;
    let logs;
    
    const functionName = await Helper.extractFunctionName(input);

    const isNFT = await Helper.isNFT(to, rpcUrl);

    if (isNFT) {
      txType = 'contract-call';

      logs = await Helper.extractNFTLogs(transactionHash, web3);

      if (functionName === 'Transfer') {
        const nftTransferDetails = await Helper.extractNFTTransferDetails(input);

        id = await safleId.getSafleId(nftTransferDetails.recepient);

        txParams = nftTransferDetails;
      }

    } else {
      logs = await Helper.extractLogs(transactionHash, web3);

      if (functionName === 'Transfer') {
        const tokenTransferDetails = await Helper.extractTokenTransferDetails(input, to, rpcUrl, from);
  
        id = await safleId.getSafleId(tokenTransferDetails.recepient);
  
        txParams = tokenTransferDetails;
      }
  
      if (functionName.includes('Swap')) {
        const tokenSwapDetails = await Helper.extractTokenSwapDetails(functionName, input, transactionHash, rpcUrl);
  
        txParams = tokenSwapDetails;
      }
    }

    const output = (txParams === undefined) ? { from, txType: 'contract-call', logs, safleId: id, functionName, timeStamp: timestamp } : { from, txType: 'contract-call', logs, safleId: id, functionName, txParams, timeStamp: timestamp };

    return output;
  }

}

module.exports = { TransactionController: TransactionController };
