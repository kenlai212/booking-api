const utility = require("../common/utility");
const {logger} = utility;

const occupancyService = require("./occupancy.service");

const WORKER_NAME = "OccupancyWorker";

const NEW_BOOKING_QUEUE_NAME = "NEW_BOOKING";
const CANCEL_BOOKING_QUEUE_NAME = "CANCEL_BOOKING";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${CANCEL_BOOKING_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${NEW_BOOKING_QUEUE_NAME}`);

    utility.subscribe(CANCEL_BOOKING_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${CANCEL_BOOKING_QUEUE_NAME} event(${msg.content})`);

        let jsonMsg = JSON.parse(msg.content);

        occupancyService.releaseOccupancy({occupancyId: jsonMsg.occupancyId})
            .catch(error => {
                logger.error(error);
            });
    });

    utility.subscribe(NEW_BOOKING_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_BOOKING_QUEUE_NAME} event(${msg.content})`);

        let jsonMsg = JSON.parse(msg.content);
        
        const input = {
            occupancyId: jsonMsg.occupancyId,
            referenceType: "BOOKING",
            referenceId: jsonMsg.bookingId
        }

        occupancyService.confirmOccupancy(input, jsonMsg.user)
            .catch(error => {
                logger.error(error);
            });
    });
}

module.exports = {
    listen
}