const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const customerService = require("./src/customer/customer.service");
const staffService = require("./src/staff/staff.service");
const boatService = require("./src/boat/boat.service");

const WORKER_NAME = "BookingWorker";

const NEW_CUSTOMER_QUEUE_NAME = "NEW_CUSTOMER";
const DELETE_CUSTOMER_QUEUE_NAME = "DELETE_CUSTOMER";
const NEW_STAFF_QUEUE_NAME = "NEW_STAFF";
const DELETE_STAFF_QUEUE_NAME = "DELETE_STAFF";
const NEW_BOAT_QUEUE_NAME = "NEW_BOAT";
const DELETE_BOAT_QUEUE_NAME = "DELETE_BOAT";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${NEW_CUSTOMER_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${DELETE_CUSTOMER_QUEUE_NAME}`);

    lipslideCommon.subscribe(NEW_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_CUSTOMER_QUEUE_NAME} event(${msg.content})`);

        let newCustomerMsg = JSON.parse(msg.content);

        customerService.newCustomer({customerId: newCustomerMsg.customerId})
        .catch(error => {
            logger.error(error);
        });
    });

    lipslideCommon.subscribe(DELETE_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_CUSTOMER_QUEUE_NAME} event(${msg.content})`);

        let deleteCustomerMsg = JSON.parse(msg.content);

        customerService.deleteCustomer({customerId: deleteCustomerMsg.customerId})
        .catch(error => {
            logger.error(error);
        });
    });

    lipslideCommon.subscribe(NEW_STAFF_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_STAFF_QUEUE_NAME} event(${msg.content})`);

        let newStaffMsg = JSON.parse(msg.content);

        staffService.newStaff({staffId: newStaffMsg.staffId})
        .catch(error => {
            logger.error(error);
        });
    });

    lipslideCommon.subscribe(DELETE_STAFF_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_STAFF_QUEUE_NAME} event(${msg.content})`);

        let deleteStaffMsg = JSON.parse(msg.content);

        staffService.deleteStaff({staffId: deleteStaffMsg.staffId})
        .catch(error => {
            logger.error(error);
        });
    });

    lipslideCommon.subscribe(NEW_BOAT_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_BOAT_QUEUE_NAME} event(${msg.content})`);

        let newBoatMsg = JSON.parse(msg.content);

        boatService.newBoat({boatId: newBoatMsg.boatId})
        .catch(error => {
            logger.error(error);
        });
    });

    lipslideCommon.subscribe(DELETE_BOAT_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_BOAT_QUEUE_NAME} event(${msg.content})`);

        let deleteBoatMsg = JSON.parse(msg.content);

        boatService.deleteBoat({boatId: deleteBoatMsg.boatId})
        .catch(error => {
            logger.error(error);
        });
    });
}

module.exports = {
    listen
}