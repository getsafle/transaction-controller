# Safle Transactions Controller

This SDK returns the list of all the transactions done by a particular address.
The transactions include both incoming and outgoing transactions. Also provided is a functionality to convert the unreadable EVM transaction data to human readable one.

## Installation

To install this SDK,

```sh
npm install --save @getsafle/transactions-controller
```

## Initialization

Initialize the constructor,

```js
const safleTransactionsController = require('@getsafle/transactions-controller');

const transactionsController = new safleTransactionsController.TransactionController();
```

<br>

> Get incoming transactions

<br>

This function returns the list of all the incoming transactions.

```js
const incomingTransactions= await transactionsController.getIncomingTransactions({ address, fromBlock, network, apiKey });
```

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected/ chain selected
* `apiKey` - etherscan/polygonscan api key(based on the network selected)

<br>

> Get outgoing transactions

<br>

This function returns the list of all the outgoing transactions.

```js
const outgoingTransactions= await transactionsController.getOutgoingTransactions({ address, fromBlock, network, apiKey });
```

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected/ chain selected
* `apiKey` - etherscan/polygonscan api key(based on the network selected)

<br>


> Get all transactions

<br>

This function returns the list of all the transactions on an address (incoming + outgoing)

```js
const transactions= await transactionsController.getTransactions({ address, fromBlock, network, apiKey });
```

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected/ chain selected
* `apiKey` - etherscan/polygonscan api key(based on the network selected)

<br>

> Analyze Transactions

<br>

This function accepts an EVM transaction hash and analyzes the transaction to output human readable values.

```js
const result = await transactionsController.analyzeTransaction(transactionHash, rpcUrl, network);
```

* `transactionHash` - The transaction hash for the transaction to be analyzed.
* `rpcUrl` - RPC URL of the chain of the transaction hash passed.
* `network` - Network to be used to query the safleId. valid inputs - mainnet or testnet

<br>

> Get Transaction Type

<br>

This function returns the type of transaction based on the contract function called.

```js
const transactionType = transactionsController.getTransactionType(functionInput, rpcUrl);
```

* `functionInput` - The function name and the input parameter datatype in string format. eg. `transfer(address, uint256)`.
* `rpcUrl` - RPC URL of the chain of the transaction hash passed.

<br>

> Chains supported

* `ropsten`
* `rinkeby`
* `kovan`
* `goerli`
* `mainnet`
* `polygon-mainnet`
* `bsc-mainnet`
* `bitcoin`