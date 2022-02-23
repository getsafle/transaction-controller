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
