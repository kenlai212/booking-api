const logger = require('./logger');
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require('dotenv').config();

function varifyAccessToken(token){
	var unhashedToken;
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, unhashed) => {
		if(err){
			throw{
				status : 403,
				message : "Invalid access token"
			}
		}
		unhashedToken = unhashed;
	});

	return unhashedToken;
}

function varifyRefreshToken(token){
	var unhashedToken;
	jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, unhashed) => {
		if(err){
			throw{
				status : 403,
				message : "Invalid refresh token"
			}
		}
		unhashedToken = unhashed;
		console.log(unhashed);
	});

	return unhashedToken;
}

function generateAccessToken(userId){
	try{
		return jwt.sign({userId:userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : process.env.REFRESH_TOKEN_TIMEOUT});
	}catch(err){
		logger.error("Error while generating token : ",err);
		throw err;
	}
}

function generateRefreshToken(userId){
	try{
		return jwt.sign({userId:userId}, process.env.REFRESH_TOKEN_SECRET);
	}catch(err){
		logger.error("Error while generating token : ",err);
		throw err;
	}
}

function comparePassword(plainTextPassword, hashedPassword){
	return new Promise((resolve, reject) => {
		bcrypt.compare(plainTextPassword, hashedPassword, function(err, res){
			if(err){
				logger.error("Error while running bcrypt.compare() : ", err);
				reject(err);
			}
			
			if(res){
				resolve(true);	
			}else{
				resolve(false);
			}
		});	
	})
}

function hashPassword(plainTextPassword){
	return new Promise((resolve, reject) => {
		bcrypt.hash(plainTextPassword, 10, function(err, hash){
			if(err){
				logger.error("Error while hashing password : ", err);
				reject(err);
			}
			
			resolve(hash);
		});
	})
	
}

function sendforgetPasswordEmail(resetPasswordKey, toEmailAddress){
	var transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_SERVICE_USER,
			pass: process.env.EMAIL_SERVICE_PASSWORD
		}
	});

	const activationURL = process.env.ACTIVATION_URL + "/" + resetPasswordKey;
	const bodyHTML = "<p>Click <a href='"+ activationURL +"'>here</a> to activate your account!</p>";
	console.log(bodyHTML);
	var mailOptions = {
		from: process.env.EMAIL_SERVICE_USER,
		to: toEmailAddress,
		subject: "Registration validation",
		html: bodyHTML
	};

	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			logger.error("Error while sending email : ", err);
			throw err;
		}else{
			logger.info('Email sent: ' + info.response);
		}
	});
}

function sendActivationEmail(activationKey, toEmailAddress){
	var transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_SERVICE_USER,
			pass: process.env.EMAIL_SERVICE_PASSWORD
		}
	});

	const bodyHTML = "<p>Click <a href='http://localhost/"+ activationKey +"'>here</a> to activate your account!</p>";
	var mailOptions = {
		from: process.env.EMAIL_SERVICE_USER,
		to: toEmailAddress,
		subject: "Registration validation",
		html: bodyHTML
	};

	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			logger.error("Error while sending email : ", err);
			throw err;
		}else{
			logger.info('Email sent: ' + info.response);
		}
	});
}

function logIncommingRequest(req){
	logger.info(req.method + ":" + req.originalUrl + " from " + req.connection.remoteAddress);
}

function logOutgoingResponse(res){
	logger.info(`${res.statusCode} ${res.statusMessage}; ${res.get('Content-Length') || 0}b sent`);
}

module.exports = {
	logIncommingRequest,
	logOutgoingResponse,
	sendActivationEmail,
	comparePassword,
	hashPassword,
	generateAccessToken,
	generateRefreshToken,
	varifyRefreshToken,
	varifyAccessToken
}