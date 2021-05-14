const utility = require("../common/utility");
const {logger} = utility;

const occupancyService = require("./occupancy.service");
const customerService = require("./customer.service");

const WORKER_NAME = "BookingWorker";

const OCCUPY_ASSET_QUEUE_NAME = "OCCUPY_ASSET";
const RELEASE_OCCUPANCY_QUEUE_NAME = "RELEASE_OCCUPANCY";
const OCCUPANCY_CONFIRMED_QUEUE_NAME = "OCCUPANCY_CONFIRMED";
const NEW_CUSTOMER_QUEUE_NAME = "NEW_CUSTOMER";
const DELETE_CUSTOMER_QUEUE_NAME = "DELETE_CUSTOMER";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${OCCUPY_ASSET_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${RELEASE_OCCUPANCY_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${OCCUPANCY_CONFIRMED_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${NEW_CUSTOMER_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${DELETE_CUSTOMER_QUEUE_NAME}`);

    utility.subscribe(OCCUPY_ASSET_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${OCCUPY_ASSET_QUEUE_NAME} event(${msg.content})`);
        
        let newOccupancyMsg = JSON.parse(msg.content);

        const input = {
            occupancyId: newOccupancyMsg.occupancyId,
            startTime: newOccupancyMsg.startTime,
            endTime: newOccupancyMsg.endTime,
            utcOffset: newOccupancyMsg.utcOffset,
            assetId: newOccupancyMsg.assetId,
            status: newOccupancyMsg.status,
            referenceType: newOccupancyMsg.referenceType
        }

        occupancyService.occupyAsset(input)
        .catch(error => {
            logger.error(error);
        });
    });

    utility.subscribe(RELEASE_OCCUPANCY_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${RELEASE_OCCUPANCY_QUEUE_NAME} event(${msg.content})`);

        let releasedOccupancyMsg = JSON.parse(msg.content);

        occupancyService.releaseOccupancy({occupancyId: releasedOccupancyMsg.occupancyId})
        .catch(error => {
            logger.error(error);
        });
    });

    utility.subscribe(OCCUPANCY_CONFIRMED_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${OCCUPANCY_CONFIRMED_QUEUE_NAME} event(${msg.content})`);

        let occupancyConfirmedMsg = JSON.parse(msg.content);

        const input = {
            occupancyId: occupancyConfirmedMsg.occupancyId,
            status: occupancyConfirmedMsg.status
        }
        
        occupancyService.confirmOccupancy(input)
        .catch(error => {
            logger.error(error);
        });
    });

    utility.subscribe(NEW_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_CUSTOMER_QUEUE_NAME} event(${msg.content})`);

        let newCustomerMsg = JSON.parse(msg.content);

        customerService.newCustomer({customerId: newCustomerMsg.customerId})
        .catch(error => {
            logger.error(error);
        });
    });

    utility.subscribe(DELETE_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_CUSTOMER_QUEUE_NAME} event(${msg.content})`);

        let deleteCustomerMsg = JSON.parse(msg.content);

        customerService.deleteCustomer({customerId: deleteCustomerMsg.customerId})
        .catch(error => {
            logger.error(error);
        });
    });
}

module.exports = {
    listen
}