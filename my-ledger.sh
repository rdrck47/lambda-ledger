#!/bin/bash
node lambdaLedger.js --price-db prices_db  \
-f index.ledger "$@"
