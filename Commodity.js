class Commodity {
    constructor(indicator, date, symbol, price){
      this.indicator = indicator;
      this.date = date;
      this.symbol = symbol;
      this.price = price;
    }
  
    get indicator(){
      return this._indicator;
    }
    set indicator(value){
       this._indicator = value;
    }
    get date(){
      return this.date;
    }
    set date(value){
      this._date = value;
   }
    get time(){
      return this._time;
    }
    set time(value){
      this._time = value;
   }
    get symbol(){
      return this._abbrevation;
    }
    set symbol(value){
      this._symbol = value;
   }
    get price(){
      return this._price;
    }
    set price(value){
      this._price = value;
    }
  }

module.exports = Commodity;