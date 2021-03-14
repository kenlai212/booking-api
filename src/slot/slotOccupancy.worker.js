const utility = require("../common/utility");
const {logger} = utility;

const slotOccupancyService = require("./slotOccupancy.service");

function listen(){
    const newOccupancyQueueName = "newOccupancy";

    utility.subscribe(newOccupancyQueueName, async function(msg){
        logger.info(`Heard ${newOccupancyQueueName} event(${msg})`);

        let newOccupancyMsg = JSON.parse(msg.content);
        const input = {
            occupancyId: newOccupancyMsg.occupancyId,
            bookingType: newOccupancyMsg.bookingType,
            startTime: newOccupancyMsg.startTime,
            endTime: newOccupancyMsg.endTime,
            utcOffset: newOccupancyMsg.utcOffset,
            assetId: newOccupancyMsg.assetId
        }

        await slotOccupancyService.newOccupancy(input, newOccupancyMsg.user);
    });
}

module.exports = {
    listen
}