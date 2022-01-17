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

`const incomingTransactions= await tranasctionsController.getIncomingTransactions({ address, fromBlock, network }) `

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected


Get outgoing transactions

`const outgoingTransactions= await tranasctionsController.getOutgoingTransactions({ address, fromBlock, network }) `

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected


Get all transactions

`const transactions= await tranasctionsController.getTransactions({ address, fromBlock, network }) `

* `address` - user wallet public address, 
* `fromBlock` - Start block number
* `network` - ethereum network selected

Note: Networks supported:
1. ropsten
2. rinkeby
3. kovan
4. goerli
5. mainnet
6. polygon-mainnet