const Helper = require('./utils/helper');
const { networks } = require('./constants');
const { INVALID_NETWORK_ERROR } = require('./constants/responses')
class TransactionController {

  async getIncomingTransactions({ address, fromBlock, network }) {
    const transactionsList = await this.getTransactions({ address, fromBlock, network });
    let incomingTransactions = [];
    transactionsList.forEach(element => {
      if (element['to'] === address.toLowerCase()) {
        incomingTransactions.push(element);
      }
    });
    return incomingTransactions;
  }

  async getOutgoingTransactions({ address, fromBlock, network }) {
    const transactionsList = await this.getTransactions({ address, fromBlock, network });
    let outgoingTransactions = [];
    transactionsList.forEach(element => {
      if (element['from'] === address.toLowerCase()) {
        outgoingTransactions.push(element);
      }
    });
    return outgoingTransactions;
  }

  async getTransactions({ address, fromBlock, network }) {
    if (!networks.includes(network)) {
      return INVALID_NETWORK_ERROR;
    }
    const etherscanSubdomain =
      network === 'mainnet' ? 'api' : `api-${network}`;

    const apiUrl = `https://${etherscanSubdomain}.etherscan.io`;
    let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;

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
}
module.exports = { TransactionController: TransactionController }