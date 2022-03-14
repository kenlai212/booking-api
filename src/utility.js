"use strict";
const mongoose = require("mongoose");

const lipslideCommon = require("lipslide-common");
const {logger, DBError, BadRequestError} = lipslideCommon;

function validateInput(schema, input){
	const result = schema.validate(input);
	
	if (result.error) {
		throw new BadRequestError(lipslideCommon.translateJoiValidationError(result.error))
	}
}

function initMongoDb(connectionURL){
    try{
        mongoose.connect(connectionURL, { useUnifiedTopology: true, useNewUrlParser: true });
        logger.info(`Connect to Mongo DB - ${connectionURL}`);
    }catch(error){
        throw new DBError(`Mongoose Connection Error: ${error}`, "Mongoose Connection Error");	
    }
}

module.exports = {
	validateInput,
    initMongoDb
}