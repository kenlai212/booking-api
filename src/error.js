class MissingMandateError extends Error{
  constructor(message) {
    super(message + " is mandatory")
    this.name = this.constructor.name
  }
}

class DBError extends Error{
  constructor(message){
    super(message);
    this.name = this.constructor.name;
  }
}

module.exports = { 
  MissingMandateError, 
  DBError 
};