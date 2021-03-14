const utility = require("../common/utility");
const {logger} = utility;

const occupancyService = require("./occupancy.service");

function listen(){
    const cancelBookingQueueName = "cancelBooking";

    utility.subscribe(cancelBookingQueueName, async function(msg){
        logger.info(`Heard ${cancelBookingQueueName} event(${msg})`);

        let cancelBookingMsg = JSON.parse(msg.content);
        const input = {
            occupancyId: cancelBookingMsg.occupancyId
        }

        await occupancyService.releaseOccupancy(input, cancelBookingMsg.user);
    });
}

module.exports = {
    listen
}