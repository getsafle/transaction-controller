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
