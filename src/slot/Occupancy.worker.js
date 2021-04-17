const utility = require("../common/utility");
const {logger} = utility;

const occupancyDomain = require("./occupancy.domain");

const OCCUPY_ASSET_QUEUE_NAME = "OCCUPY_ASSET";
const RELEASE_OCCUPANCY_QUEUE_NAME = "RELEASE_OCCUPANCY"

function listen(){
    //listen to occupy asset
    utility.subscribe(OCCUPY_ASSET_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${OCCUPY_ASSET_QUEUE_NAME} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);

        const input = {
            occupancyId: jsonMsg.occupancyId,
            bookingType: jsonMsg.bookingType,
            startTime: jsonMsg.startTime,
            endTime: jsonMsg.endTime,
            utcOffset: jsonMsg.utcOffset,
            assetId: jsonMsg.assetId
        }

        await occupancyDomain.createOccupancy(input, jsonMsg.user);
    });

    //listen to release occupancy
    utility.subscribe(RELEASE_OCCUPANCY_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${RELEASE_OCCUPANCY_QUEUE_NAME} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);

        await occupancyDomain.deleteOccupancy({occupancyId: jsonMsg.occupancyId});
    });
}

module.exports = {
    listen
}