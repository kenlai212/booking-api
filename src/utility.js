"use strict";
const mongoose = require("mongoose");
const config = require('config');

const lipslideCommon = require("lipslide-common");
const {logger, DBError, BadRequestError} = lipslideCommon;

function validateInput(schema, input){
	const result = schema.validate(input);
	
	if (result.error) {
		throw new BadRequestError(lipslideCommon.translateJoiValidationError(result.error))
	}
}

function initMongoDb(){
    const connUrl = config.get("db.mongoDb.url");

    let connOptions;
    if(config.get("db.mongoDb.ssl")){
        connOptions = {
            useUnifiedTopology: true, 
            useNewUrlParser: true,
            ssl: true,
            sslValidate: false,
            sslCA: config.get("db.mongoDb.sslCert")
        }
    }else{
        connOptions = {
            "useUnifiedTopology": true, 
            "useNewUrlParser": true
        }
    }

    try{
        mongoose.connect(connUrl, connOptions);
        logger.info(`Connect to Mongo DB - ${connUrl}`);
    }catch(error){
        throw new DBError(`Mongoose Connection Error: ${error}`, "Mongoose Connection Error");	
    }
}

module.exports = {
	validateInput,
    initMongoDb
}