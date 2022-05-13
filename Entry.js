class Entry {
    constructor(date, description, senderAccount, senderQuantity, receiverAccount, receiverQuantity){
      this.date = date;
      this.description = description;
      this.senderAccount = senderAccount;
      this.senderQuantity = senderQuantity;
      this.receiverAccount = receiverAccount;
      this.receiverQuantity = receiverQuantity;
    }  
}

module.exports = Entry;