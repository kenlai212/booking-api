const amqp = require('amqplib');
const { createLogger, format, transports } = require("winston");
const moment = require("moment");

require("dotenv").config();

function validateDateIsoStr(isoStr, utcOffset){
	if(!isoStr)
		throw { name: customError.BAD_REQUEST_ERROR, message: "isoStr is mandatory" };
	
	const dateMoment = moment(isoStr);
	if(!dateMoment.isValid)
		throw { name: customError.BAD_REQUEST_ERROR, message: "invalid isoStr" };

	if(!utcOffset)
		throw { name: customError.BAD_REQUEST_ERROR, message: "utcOffset is mandatory" };

	if(utcOffset < -12 || utcOffset > 14)
		throw { name: customError.BAD_REQUEST_ERROR, message: "invalid utcOffset" };

	return true;
}

function isoStrToDate(isoStr, utcOffset) {
	const dateStr = isoStr.substr(0, 10);
	const dateRes = dateStr.split("-");

	const timeStr = isoStr.substr(11, 8);
	const timeRes = timeStr.split(":")

	const targetDateTime = moment()
		.utcOffset(parseInt(utcOffset))
		.set({
			year: parseInt(dateRes[0]),
			month: parseInt(dateRes[1]) - 1,
			date: parseInt(dateRes[2]),
			hour: parseInt(timeRes[0]),
			minute: parseInt(timeRes[1]),
			second: parseInt(timeRes[2]),
			millisecond: 0
		}).toDate();

	return targetDateTime;
}

function validateInput(schema, input){
	const result = schema.validate(input);
	
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}
}

function userGroupAuthorization(userGroups, allowGroups){
	if (userGroups == null) {
        userGroups = [];
    }

    const targetGroup = userGroups.filter(value => allowGroups.includes(value));

    if (targetGroup.length == 0) {
        throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
    }
}

async function publishEvent(message, exchange, rollback){
    var msg = JSON.stringify(message);

    let connection;
    try{
        connection = await amqp.connect(process.env.AMQP_URL);
    }catch(error){
        rollback();
	 	logger.error("utility.publishEvent error : ", error);
	 	throw { name: customError.INTERNAL_SERVER_ERROR, message: "AMQP Connection problem" };
    }
    
    let channel;
    try{
        channel = await connection.createChannel();
    }catch(error){
        rollback();
	 	logger.error("utility.publishEvent error : ", error);
	 	throw { name: customError.INTERNAL_SERVER_ERROR, message: "Create Channel problem" };
    }
    
    await channel.assertExchange(exchange, 'fanout', {
        durable: false
    });

    channel.publish(exchange, '', Buffer.from(msg));

    channel.close();
}

async function subscribe(exchange, exchangeResponse){
    let connection;
    try{
        connection = await amqp.connect(process.env.AMQP_URL);
    }catch(error){
        logger.error("utility.subscribe error : ", error);
	 	throw { name: customError.INTERNAL_SERVER_ERROR, message: "AMQP Connection problem" };
    }

    let channel;
    try{
        channel = await connection.createChannel();
    }catch(error){
        rollback();
	 	logger.error("utility.subscribe error : ", error);
	 	throw { name: customError.INTERNAL_SERVER_ERROR, message: "Create Channel problem" };
    }

    await channel.assertExchange(exchange, 'fanout', {
        durable: false
    });

    let q = await channel.assertQueue('', {
        exclusive: true
    });

    await channel.bindQueue(q.queue, exchange, '');

    channel.consume(q.queue, function(msg){
        exchangeResponse(msg);
    }, { noAck: true });

    //console.log(`Listening to ${exchange}`);
}

const env = process.env.NODE_ENV || "development";

const logger = createLogger({
    // change level if in dev environment versus production
    level: env === "development" ? "debug" : "info",
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(
            info => `${info.timestamp} ${info.level} : ${info.message}`
        )
    ),
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        })
    ]
});

const customError = {
    UNAUTHORIZED_ERROR: "UnauthorizedError",
    BAD_REQUEST_ERROR: "BadRequestError",
    INTERNAL_SERVER_ERROR: "InternalServerError",
    RESOURCE_NOT_FOUND_ERROR: "ResourceNotFound",
    JWT_ERROR: "JWTError"
}

module.exports = {
    validateDateIsoStr,
    isoStrToDate,
	validateInput,
	userGroupAuthorization,
	publishEvent,
    subscribe,
    logger,
    customError
}