//Dependencies
const commander = require("commander");
const chalk = require("chalk");
const fs = require("fs");
//Classes
const Commodity = require("./Commodity");
const Entry = require("./Entry");

const parseQuantity = (quantity) => {
  let float = quantity.replace(/[^\d.-]/g, "").trim();
  return parseFloat(float);
};

const accountsSearch = (account1, account2, search) => {
  return (
    account1.search(new RegExp(search, "i")) !== -1 ||
    account2.search(new RegExp(search, "i")) !== -1
  );
};

const colorNumDecision = (quantity) => {
  return parseQuantity(quantity) > 0
    ? chalk.white(quantity)
    : chalk.red(quantity);
};

const parseCurrency = (quantity) => {
  return quantity.replace(/[,-\d.]/g, "").trim();
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",];

class Ledger {
  constructor() {
    this.files = null;
    this.sortBy = "d";
  }
  /*File processing methods*/

  ledgerFile(path) {
    this.files = this.readLedgerFile(path);
    this.parseEntries();
  }

  readLedgerFile(strPath) {
    let files;
    try {
      const data = fs.readFileSync(strPath, "utf8");
      files = data
        .trim()
        .split("!include ")
        .filter((word) => word.length > 0);
      return files;
    } catch (err) {
      console.error(err);
    }
  }

  priceDbFile(path) {
    let lines = this.readPriceDbFile(path);
    this.parseCommodities(lines);
  }

  readPriceDbFile(strPath) {
    try {
      const data = fs
        .readFileSync(strPath, "utf8")
        .trim()
        .split("\n")
        .filter((word) => word.length > 0 && !word.startsWith(";"));
      return data;
    } catch (err) {
      console.error(err);
    }
  }

  parseEntries() {
    this.entries = [];
    this.files.forEach((file) => {
      let lines = fs
        .readFileSync(file.trim(), "utf8")
        .split("\n")
        .filter((word) => word.length > 0 && !word.startsWith(";"));

      for (let index = 0; index < lines.length; index = index + 3) {
        let firstLine = lines[index].split(" ");
        let secondLine = lines[index + 1]
          .trim()
          .replace(/\t/g, "\t")
          .split("\t")
          .filter((word) => word.length > 0);
        let thirdLine = lines[index + 2]
          .trim()
          .replace(/\t/g, "\t")
          .split("\t")
          .filter((word) => word.length > 0);
        let date = new Date(firstLine.shift());
        let description = firstLine.join(" ");
        let senderAccount = secondLine[0];
        let senderQuantity = secondLine[1];
        let receiverAccount = thirdLine[0];
        let receiverQuantity = senderQuantity;
        if (thirdLine[1]) {
          receiverQuantity = thirdLine[1];
        }
        if (parseQuantity(senderQuantity) == parseQuantity(receiverQuantity)) {
          receiverQuantity =
            parseCurrency(senderQuantity) +
            "" +
            parseQuantity(senderQuantity) * -1;
        }
        this.entries.push(
          new Entry(
            date,
            description,
            senderAccount,
            senderQuantity,
            receiverAccount,
            receiverQuantity
          )
        );
      }
    });
  }

  parseCommodities(lines) {
    this.commodities = [];
    let indicator;
    let date;
    let symbol;
    let price;
    let splitLine;

    lines.forEach((line) => {
      if (line.startsWith("D")) {
        splitLine = line.split(" ");
        indicator = "D";
        date = null;
        symbol = parseCurrency(splitLine[1]);
        price = parseQuantity(splitLine[1]);
        this.commodities.push(new Commodity(indicator, date, symbol, price));
      } else if (line.startsWith("N")) {
        splitLine = line.split(" ");
        indicator = "N";
        date = null;
        symbol = parseCurrency(line.split(" ")[1]);
        price = null;
        this.commodities.push(new Commodity(indicator, date, symbol, price));
      } else if (line.startsWith("P")) {
        splitLine = line.split(" ");
        indicator = "P";
        date = new Date(splitLine[1] + " " + splitLine[2]);
        symbol = splitLine[3];
        price = parseQuantity(splitLine[4]);

        this.commodities.push(new Commodity(indicator, date, symbol, price));
      }
    });
  }

  convertCurrencies() {
    this.entries.forEach((entry) => {
      let sndCurrency = parseCurrency(entry.senderQuantity);
      let rcvCurrency = parseCurrency(entry.receiverQuantity);
      let defaultCurrency = this.commodities.find((comm) => {
        return comm._indicator === "N";
      })._symbol;
      if (sndCurrency !== defaultCurrency) {
        let conversionPriceCurrency = this.commodities.find((comm) => {
          return comm._symbol === sndCurrency;
        })._price;
        entry.senderQuantity =
          defaultCurrency +
          "" +
          (
            parseQuantity(entry.senderQuantity) * conversionPriceCurrency
          ).toFixed(2);
      }
      if (rcvCurrency !== defaultCurrency) {
        let conversionPriceCurrency = this.commodities.find((comm) => {
          return comm._symbol === rcvCurrency;
        })._price;
        entry.receiverQuantity =
          defaultCurrency +
          "" +
          (
            parseQuantity(entry.receiverQuantity) * conversionPriceCurrency
          ).toFixed(2);
      }
    });
  }

  /*Commands methods*/
  print(accountsPattern) {
    if (this.commodities) {
      this.convertCurrencies();
    }
    let numSpaces = 50;
    if (accountsPattern) {
      this.entries.forEach((entry) => {
        if (
          accountsSearch(
            entry.senderAccount,
            entry.receiverAccount,
            accountsPattern
          )
        ) {
          console.log(
            entry.date.getFullYear().toString().substring(2) +
              "-" +
              months[entry.date.getMonth()] +
              "-" +
              entry.date.getDate() +
              " " +
              entry.description
          );
          console.log(
            "\t" + entry.senderAccount + " ".repeat(numSpaces-entry.senderAccount.length) + entry.senderQuantity
          );
          
          console.log("\t" + entry.receiverAccount);
        }
      });
    } else {
      this.entries.forEach((entry) => {
        console.log(
          entry.date.getFullYear().toString().substring(2) +
            "-" +
            months[entry.date.getMonth()] +
            "-" +
            entry.date.getDate() +
            " " +
            entry.description
        );
        console.log(
          "\t" + entry.senderAccount +  " ".repeat(numSpaces-entry.senderAccount.length) + entry.senderQuantity
        );
        console.log(" ".repeat("\t" + entry.receiverAccount));
      });
    }
  }

  balance(accountsPattern) {
    if (this.commodities) {
      this.convertCurrencies();
    }

    let accounts = new Map();
    
    this.entries.forEach((entry) => {

        if (!accountsSearch(entry.senderAccount,entry.receiverAccount,accountsPattern)) {
            return;
        }

      let sender = entry.senderAccount.trim();
      let sentMoney = entry.senderQuantity;
      let receiver = entry.receiverAccount.trim();
      let receivedMoney = entry.receiverQuantity;

      if (!accounts.has(sender)) {
        accounts.set(sender, [sentMoney]);
      } else {
        accounts.get(sender).push(sentMoney);
      }
      if (!accounts.has(receiver)) {
        accounts.set(receiver, [receivedMoney]);
      } else {
        accounts.get(receiver).push(receivedMoney);
      }
    });

    Array.from(accounts.keys())
      .sort()
      .forEach((account) => {

        if (!accountsSearch(account,"",accountsPattern)) {
            return;
        }

        let currentQuantity = accounts
          .get(account)
          .reduce((pv, cv) => pv + parseQuantity(cv), 0)
          .toFixed(2);
        let currency = parseCurrency(accounts.get(account)[0]);
        let currencyAndQuantity = "";
        if (currency === "$") {
          currencyAndQuantity = currency + "" + currentQuantity;
        } else {
          currencyAndQuantity = currentQuantity + " " + currency;
        }
        let numSpaces = 30;

        if (currentQuantity > 0) {
          console.log(
            "\t" +
              chalk.white(currencyAndQuantity) +
              " ".repeat(numSpaces-currencyAndQuantity.length) +
              chalk.blue(account)
          );
        } else {
          console.log(
            "\t" +
              chalk.red(currencyAndQuantity) +
              " ".repeat(numSpaces-currencyAndQuantity.length) +
              chalk.blue(account)
          );
        }
      });
    console.log("------------------------------------------------------------");

    let balance = new Map();

    Array.from(accounts.values()).forEach((accountTransaction) => {
      accountTransaction.forEach((value) => {
        if (this.commodities) {
          let currentCurrency = parseCurrency(value);
          if (!balance.has(currentCurrency)) {
            balance.set(currentCurrency, parseQuantity(value));
          } else {
            balance.set(
              currentCurrency,
              balance.get(currentCurrency) + parseQuantity(value)
            );
          }
        }
      });
    });

    Array.from(balance.keys()).forEach((currency) => {
      let balanceValue = balance.get(currency).toFixed(2);
      let balanceString = "";
      if (currency === "$") {
        balanceString = currency + "" + balanceValue;
      } else {
        balanceString = balance.get(currency) + " " + currency;
      }
      if (balanceValue > 0) {
        console.log("\t" + chalk.white(balanceString));
      } else {
        console.log("\t" + chalk.red(balanceString));
      }
    });
  }

  register(accountsPattern) {
    if (this.commodities) {
      this.convertCurrencies();
    }
    let accounts = new Map();
    let remaining = new Map();
    let numSpaces = 70;
    let numSpacesMoney = 40;

    this.entries.forEach((entry) => {
      let sender = entry.senderAccount.trim();
      let sentMoney = entry.senderQuantity;
      let receiver = entry.receiverAccount.trim();
      let receivedMoney = entry.receiverQuantity;

      if (!accounts.has(sender)) {
        accounts.set(sender, [sentMoney]);
      } else {
        accounts.get(sender).push(sentMoney);
      }
      if (!accounts.has(receiver)) {
        accounts.set(receiver, [receivedMoney]);
      } else {
        accounts.get(receiver).push(receivedMoney);
      }

      if(accountsPattern){
        if(!accountsSearch(entry.senderAccount,entry.receiverAccount,accountsPattern)){
          return;
        }
      }

      console.log(
        entry.date.getFullYear().toString().substring(2) +
          "-" +
          months[entry.date.getMonth()] +
          "-" +
          entry.date.getDate() +
          "\t\t " +
          entry.description +
          " ".repeat(numSpaces-new String(entry.description).length) +
          chalk.blue(entry.senderAccount) +
          " ".repeat(numSpacesMoney-new String(entry.senderAccount).length) +
          colorNumDecision(sentMoney) +
          " ".repeat(25-new String(sentMoney).length) +
          colorNumDecision(sentMoney)
      );

      if (parseQuantity(sentMoney) === parseQuantity(receivedMoney) * -1) {
        if(accountsPattern){
          if(!accountsSearch(entry.receiverAccount,".....",accountsPattern)){
            return;
          }
        }
        console.log(
          " ".repeat(95) +
            chalk.blue(entry.receiverAccount) +
            " ".repeat(numSpacesMoney-entry.receiverAccount.length) +
            colorNumDecision(receivedMoney) +
            " ".repeat(25-new String(receivedMoney).length) +
            "0"
        );
      } else {
        let currentReceived = parseCurrency(receivedMoney);
        let currentSent = parseCurrency(sentMoney);
        if (!remaining.has(currentReceived)) {
          remaining.set(currentReceived, parseQuantity(receivedMoney));

          if(accountsPattern){
            if(!accountsSearch(entry.receiverAccount,"....",accountsPattern)){
              return;
            }
          }

          console.log(
            " ".repeat(95) +
              chalk.blue(entry.receiverAccount) +
              " ".repeat(numSpacesMoney-new String(entry.receiverAccount).length) +
              colorNumDecision(receivedMoney) +
              " ".repeat(25-new String(receivedMoney).length) +
              colorNumDecision(sentMoney)
          );
        } else {
          remaining.set(
            currentReceived,
            remaining.get(currentReceived) + parseQuantity(receivedMoney)
          );
        }
        if (!remaining.has(currentSent)) {
          remaining.set(currentSent, parseQuantity(sentMoney));
          if(accountsPattern){
            if(!accountsSearch(entry.receiverAccount,"......",accountsPattern)){
              return;
            }
          }
          console.log(
            " ".repeat(95) +
              chalk.blue(entry.receiverAccount) +
              " ".repeat(numSpacesMoney-new String(entry.receiverAccount).length) +
              colorNumDecision(receivedMoney) +
              " ".repeat(25-new String(receivedMoney).length) +
              colorNumDecision(receivedMoney)
          );
        } else {
          remaining.set(
            currentSent,
            remaining.get(currentSent) + parseQuantity(sentMoney)
          );
        }
      }
    });
  }

  /*Flag --sort*/

  sort(sortBy) {
    this.sortBy = sortBy;
    switch (this.sortBy) {
      case "date":
      case "d":
        this.entries = this.entries.sort(function (entry, nextEntry) {
          if (entry.date < nextEntry.date) {
            return -1;
          }
          if (entry.date > nextEntry.date) {
            return 1;
          }
        });
        break;
      case "amount":
      case "a":
        this.entries = this.entries.sort(function (entry, nextEntry) {
          if (
            parseQuantity(entry.senderQuantity) >
            parseQuantity(nextEntry.senderQuantity)
          ) {
            return -1;
          }
          if (
            parseQuantity(entry.senderQuantity) <
            parseQuantity(nextEntry.senderQuantity)
          ) {
            return 1;
          }
        });
        break;
      default:
        console.err(this.sortBy + " is not a valid sorting option");
        break;
    }
  }
}

var ledger = new Ledger();

function ledgerFile(path) {
  ledger.ledgerFile(path);
}
function priceDbFile(path) {
  ledger.priceDbFile(path);
}
function bal(accounts) {
  ledger.balance(accounts);
}

function register(accounts) {
  ledger.register(accounts);
}

function sort(sortBy) {
  ledger.sort(sortBy);
}

function print(accounts) {
  ledger.print(accounts);
}

commander
  .option("-f, --file <file name>", "Main file argument", ledgerFile)
  .option("--price-db <commodities file name>", "Prices DB File argument", priceDbFile)
  .option("--sort <Value expression>", "Sorting argument", sort);

commander.command("bal [accounts...]").action(function (accounts) {
  bal(accounts);
});
commander.command("balance [accounts...]").action(function (accounts) {
  bal(accounts);
});
commander.command("print [accounts...]").action(function (accounts) {
  print(accounts);
});
commander.command("reg [accounts...]").action(function (accounts) {
  register(accounts);
});
commander.command("register [accounts...]").action(function (accounts) {
  register(accounts);
});
commander.parse(process.argv);
