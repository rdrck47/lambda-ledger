# Lambda Ledger

> Minimal implementation of Ledger-cli built on Node

## Requirements

- NodeJS

## Install

```sh
$npm install
chmod +x my-ledger.sh
```

## Usage

To execute Ledger run the following command 

```sh
$ ./my-ledger.sh [flags] [commands]

```

##Flags 
- Sort - Sort transactions by date or by amount
--sort [date|amount]

- File - Load ledger files
--file [filename]

- Price-db - Load a database with prices of different commodities

--price-db [filename]

