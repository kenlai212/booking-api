const logger = require('./logger');
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {MissingMandateError, DBError} = require("./error");
require('dotenv').config();

function expandStartSearchRange(startTime){
	if(startTime == null){
		throw new MissingMandateError("startTime");
	}
	
	startTime.setTime(startTime.getTime() - (2*60*60*1000));
	return startTime;
}

function expandEndSearchRange(endTime){
	if(endTime == null){
		throw new MissingMandateError("endTime");
	}
	
	endTime.setTime(endTime.getTime() - (2*60*60*1000));
	return endTime;
}



module.exports = {
	expandStartSearchRange,
	expandEndSearchRange,
}