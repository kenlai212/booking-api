const utility = require("../common/utility");
const {logger} = utility;

const occupancyService = require("./occupancy.service");

function listen(){
    const cancelBookingQueueName = "cancelBooking";

    utility.subscribe(cancelBookingQueueName, async function(msg){
        logger.info(`Heard ${cancelBookingQueueName} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);
        
        const input = {
            occupancyId: jsonMsg.occupancyId
        }

        await occupancyService.releaseOccupancy(input, jsonMsg.user);
    });

    const newBookingQueueName = "newBooking";

    utility.subscribe(newBookingQueueName, async function(msg){
        logger.info(`Heard ${newBookingQueueName} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);
        
        const input = {
            occupancyId: jsonMsg.occupancyId
        }

        await occupancyService.confirmOccupancy(input, jsonMsg.user);
    });
}

module.exports = {
    listen
}