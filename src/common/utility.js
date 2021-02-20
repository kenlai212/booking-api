const amqp = require('amqplib/callback_api');
const moment = require("moment");

const {logger} = require("../common/logger");
const customError = require("./customError");

require("dotenv").config();

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

function publishEvent(message, queueName, user){
    amqp.connect(process.env.AMQP_URL, function(error0, connection) {
        if (error0) {
			logger.err("utility.publishEvent error : ", error0);
			throw { name: customError.INTERNAL_SERVER_ERROR, message: "AMQP Connection problem" };
        }
        
        connection.createChannel(function(error1, channel) {
            if (error1) {
				logger.err("utility.publishEvent error : ", error1);
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Create Channel problem" };
            }
            
			if(!user){
				throw { name: customError.INTERNAL_SERVER_ERROR, message: "Missing User"}
			}
			message.user = user;
            var msg = JSON.stringify(message);

            channel.assertQueue(queueName, {
                durable: true
            });

            channel.sendToQueue(queueName, Buffer.from(msg));
        });

        setTimeout(function() {
            connection.close();
        }, 500);
    });
}

module.exports = {
	isoStrToDate,
	validateInput,
	userGroupAuthorization,
	publishEvent
}