# **Safle Transactions Controller**

Safle Transactions Controller SDK


## **Installation and Usage**

> Installation

Install the package by running the command,

`npm install @getsafle/transactions-controller`

Import the package into your project using,

`const safleTransactionsController = require('@getsafle/transactions-controller');`

## **Transactions Controller**

> Initialising

Initialise the class using,

`const transactionsController = new safleTransactionsController.TransactionController();` 

> Methods

Get incoming transactions

`const incomingTransactions= await transactionsController.getIncomingTransactions({ address, fromBlock, network, apiKey }) `

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected
* `apiKey` - etherscan/polygonscan api key(based on the network selected)


Get outgoing transactions

`const outgoingTransactions= await transactionsController.getOutgoingTransactions({ address, fromBlock, network, apiKey }) `

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected
* `apiKey` - etherscan/polygonscan api key(based on the network selected)


Get all transactions

`const transactions= await transactionsController.getTransactions({ address, fromBlock, network, apiKey }) `

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected
* `apiKey` - etherscan/polygonscan api key(based on the network selected)

Note: Networks supported:
1. ropsten
2. rinkeby
3. kovan
4. goerli
5. mainnet
6. polygon-mainnet
6. bsc-mainnet


Analyze Transactions

`const result = await transactionsController.analyzeTransaction(transactionHash, rpcUrl, network)`

* `transactionHash` - The transaction hash for the transaction to be analyzed.
* `rpcUrl` - RPC URL of the chain of the transaction hash passed.
* `network` - Network to be used to query the safleId. valid inputs - mainnet or testnet
