### 1.0.0 (2021-05-10)

* Added methods to get user transactions
* Pipelines added

### 1.0.1 (2022-01-17)

* Updated methods to get user transactions on polygon chain

### 1.0.2 (2022-01-18)

* Updated methods to accept etherscan/polygonscan api key

### 1.1.2 (2022-02-16)

* Created a method to analyze the transaction and return the transaction parameters such as events, decoded data, recepient safleId, function name, etc.

### 1.1.3 (2022-02-22)

* `analyzeTransaction()` function returns the transaction timestamp.
* If the transactionHash belongs to a token transfer, then the amount is calculated keeping the decimal precision in check and also returns the token symbol.

### 1.2.0 (2022-03-23)

* `analyzeTransaction()` function now extracts & returns the swap function parameters like `srcToken`, `destToken`, `srcAmount`, `destAmount`, `srcContractAddress` and `destContractAddress`.

### 1.3.0 (2022-03-27)

* `analyzeTransaction()` function now extracts & returns the nft transaction parameters like the sender address, receiver address and the token id.

### 1.4.0 (2022-03-29)

* `analyzeTransaction()` - Added detection and parameter extraction for `transferFrom` function call for erc20 and erc721 tokens.

### 1.4.1 (2022-03-31)

* `analyzeTransaction()` - Added detection for `safeTransferFrom` function calls for erc721 tokens.

### 1.5.0 (2022-04-06)

* Updated methods to get user transactions on binance smart chain

### 1.5.1 (2022-04-08)

* `analyzeTransaction()` returns the contract address paramater for contract-interaction transaction.

### 1.6.1 (2022-04-18)

* `analyzeTransaction()` also detects the NFTs which uses the deprecated erc721 contract standard. Supported old NFT contracts include [CryptoKitties](https://etherscan.io/address/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d) and [CryptoPunks](https://etherscan.io/address/0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB).

### 1.7.0 (2022-05-05)

* `getTransactionType()` - Added a function to detect the type of transaction based on the function name and input datatype.

### 1.7.1 (2022-05-11)

* Updated methods to get transactions on avalanche chain

### 1.7.2 (2022-06-23)

* Updated methods to get transactions on bitcoin chain

### 1.8.0 (2022-08-29)

* Updated getTransactions method for transactions on polygon chain


### 1.8.1 (2022-09-12)

* Updated the README file with the latest functional & non-functional documentation.

### 1.9.0 (2022-09-13)

* Updated getTransactions method for transactions on bsc and ethereum chain
