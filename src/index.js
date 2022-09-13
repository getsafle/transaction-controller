const Web3 = require('web3');
const SafleId = require('@getsafle/safle-identity-wallet').SafleID;

const Helper = require('./utils/helper');
const { networks } = require('./constants');
const { INVALID_NETWORK_ERROR } = require('./constants/responses');
const sigs = require('./function-signatures');

class TransactionController {

  async getIncomingTransactions({ address, fromBlock, network, apiKey }) {
    const transactionsList = await this.getTransactions({ address, fromBlock, network, apiKey });

    let incomingTransactions = [];

    if(network === 'bitcoin') {
      transactionsList.forEach(element => {
        if (element['to'].includes(address.toLowerCase())) {
          incomingTransactions.push(element);
        }
      });
    }
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
    if(network === 'bitcoin') {
      transactionsList.forEach(element => {
        if (element['from'].includes(address.toLowerCase())) {
          outgoingTransactions.push(element);
        }
      });
    }
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

    if(network === 'bitcoin') {
      let url = `${apiUrl}/${address}`;
      const { response } = await Helper.getRequest({ url });

      let unSpendTxnDetails = []
      response.txs.forEach(r => {
  
          let tx = {
              "blockNumber": r.block_height,
              "timeStamp": r.time,
              "hash": r.hash,
              "transactionIndex": r.tx_index,
              "from": r.inputs.map(r => r.prev_out.addr),
              "to": r.out.map(z => z.addr),
              "gas": r.fee,
              "isError": "",
              "txreceipt_status": "",
              "input": r.inputs,
          }
          unSpendTxnDetails.push(tx)
      });
      return unSpendTxnDetails;
    }

    else{
      let url = `${apiUrl}/address/${address}/transactions?page=1&pageSize=100&auth_key=${apiKey}`;
      const { response } = await Helper.getRequest({ url });
      const {transactions} = response

      transactions.forEach(async(element)=>{
        element.hash = element.id;
        element.blockNumber = element.block;
        element.timeStamp = element.date;
        delete element.id;
        delete element.block;
        delete element.date;
      })

      return transactions;
    }
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

      if (functionName.includes('Transfer')) {
        const nftTransferDetails = await Helper.extractNFTTransferDetails(input, functionName, to, from, web3);

        txParams = nftTransferDetails;
        
        id = await safleId.getSafleId(nftTransferDetails.recepient);
      }

    } else {
      logs = await Helper.extractLogs(transactionHash, web3);

      if (functionName.includes('Transfer')) {
        const tokenTransferDetails = await Helper.extractTokenTransferDetails(input, to, rpcUrl, from, functionName);
  
        id = await safleId.getSafleId(tokenTransferDetails.recepient);
  
        txParams = tokenTransferDetails;
      }
  
      if (functionName.includes('Swap')) {
        const tokenSwapDetails = await Helper.extractTokenSwapDetails(functionName, input, transactionHash, rpcUrl);
  
        txParams = tokenSwapDetails;
      }
    }

    const contractAddress = to;

    const output = (txParams === undefined) ? { from, txType: 'contract-call', logs, safleId: id, functionName, timeStamp: timestamp, contractAddress } : { from, txType: 'contract-call', logs, safleId: id, functionName, txParams, timeStamp: timestamp, contractAddress };

    return output;
  }

  getTransactionType(functionInput, rpcUrl) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

    const signature = web3.eth.abi.encodeFunctionSignature(functionInput);

    let functionName = (sigs[signature] === undefined) ? signature : sigs[signature];

    let output;

    if (functionName.includes('Swap')) {
      output = 'Swap';
    } else {
      output = functionName;
    }

    console.log(output);

    return output;
  }

}

module.exports = { TransactionController: TransactionController };
