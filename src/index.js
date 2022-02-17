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

    const { to, value, from, input } = await web3.eth.getTransaction(transactionHash);

    const isEOA = await Helper.isEOA(to, web3);

    if (isEOA) {
      txType = 'native-asset-transfer';

      const id = await safleId.getSafleId(to);

      const output = { from, value: web3.utils.fromWei(value, 'ether'), txType, safleId: id, to }

      return output;
    }

    const logs = await Helper.extractLogs(transactionHash, web3);

    const functionName = await Helper.extractFunctionName(input);

    let tokenTxParams;
    let id;

    if (functionName === 'Transfer') {
      const tokenTransferDetails = await Helper.extractTokenTransferDetails(input, web3);

      id = await safleId.getSafleId(tokenTransferDetails.recepient);

      tokenTxParams = tokenTransferDetails;
    }

    const output = (tokenTxParams === undefined) ? { from, txType: 'contract-call', logs, safleId: id, functionName } : { from, txType: 'contract-call', logs, safleId: id, functionName, txParams: tokenTxParams };

    return output;
  }

}

module.exports = { TransactionController: TransactionController };
