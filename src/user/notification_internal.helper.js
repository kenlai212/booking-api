const logger = require("../common/logger").logger;

const notificationService = require("../notification/notification.service");

async function sendEmail(input, user){
    try {
        return await notificationService.sendEmail(input, user);
    } catch (error) {
        console.log(error);
        logger.error("Error while call occupancyService.occupyAsset : ", error);
        throw error;
    }
}

module.exports = {
    sendEmail
}