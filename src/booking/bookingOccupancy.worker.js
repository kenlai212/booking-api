const utility = require("../common/utility");
const {logger} = utility;

const bookingOccupancy = require("./bookingOccupancy.service");

function listen(){
    const newOccupancyQueueName = "newOccupancy";

    utility.subscribe(newOccupancyQueueName, async function(msg){
        logger.info(`Heard ${newOccupancyQueueName} event(${msg})`);

        let newOccupancyMsg = JSON.parse(msg.content);
        const input = {
            startTime: newOccupancyMsg.startTime,
            endTime: newOccupancyMsg.endTime,
            assetId: newOccupancyMsg.assetId
        }

        await bookingOccupancy.newBookingOccupancy(input, newOccupancyMsg.user);
    });

    const releasedOccupancyQueueName = "releasedOccupancy";

    utility.subscribe(releasedOccupancyQueueName, async function(msg){
        logger.info(`Heard ${releasedOccupancyQueueName} event(${msg})`);

        let releasedOccupancyMsg = JSON.parse(msg.content);
        const input = {
            occupancyId = releasedOccupancyMsg.occupancyId
        }

        await bookingOccupancy.deleteBookingOccupancy(input, releasedOccupancyMsg.user);
    });
}

module.exports = {
    listen
}