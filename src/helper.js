const logger = require('./logger');
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {MissingMandateError, DBError} = require("./error");
require('dotenv').config();

function logIncommingRequest(req){
	logger.info(req.method + ":" + req.originalUrl + " from " + req.connection.remoteAddress);
}

function logOutgoingResponse(res){
	logger.info(`${res.statusCode} ${res.statusMessage}; ${res.get('Content-Length') || 0}b sent`);
}

/********************************************************
extends start search range by 2 hrs
********************************************************/
function expandStartSearchRange(startTime){
	if(startTime == null){
		throw new MissingMandateError("startTime");
	}

	startTime.setTime(startTime.getTime() - (2*60*60*1000));

	return startTime;
}

/********************************************************
extends end search range by 2 hrs
********************************************************/
function expandEndSearchRange(endTime){
	if(endTime == null){
		throw new MissingMandateError("endTime");
	}

	endTime.setTime(endTime.getTime() + (2*60*60*1000));

	return endTime;
}



module.exports = {
	logIncommingRequest,
	logOutgoingResponse,
	expandStartSearchRange,
	expandEndSearchRange
}