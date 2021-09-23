const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const personService = require("./src/person/person.service");
const staffService = require("./src/staff/staff.service");
const occupancyService = require("./src/occupancy/occupancy.service");

const WORKER_NAME = "BookingWorker";

const NEW_STAFF_QUEUE_NAME = "NEW_STAFF";
const DELETE_STAFF_QUEUE_NAME = "DELETE_STAFF";
const NEW_PERSON_QUEUE_NAME = "NEW_PERSON";
const DELETE_PERSON_QUEUE_NAME = "DELETE_PERSON";
const NEW_OCCUPANCY_QUEUE_NAME = "OCCUPY_ASSET";
const DELETE_OCCUPANCY_QUEUE_NAME = "RELEASE_OCCUPANCY";
const CONFIRM_OCCUPANCY_QUEUE_NAME = "CONFIRM_OCCUPANCY";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${NEW_STAFF_QUEUE_NAME}`);
    lipslideCommon.subscribe(NEW_STAFF_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_STAFF_QUEUE_NAME} event(${msg.content})`);

        let newStaffMsg = JSON.parse(msg.content);

        staffService.newStaff({staffId: newStaffMsg.staffId})
        .catch(error => {
            logger.error(error);
        });
    });

    logger.info(`${WORKER_NAME} listenting to ${DELETE_STAFF_QUEUE_NAME}`);
    lipslideCommon.subscribe(DELETE_STAFF_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_STAFF_QUEUE_NAME} event(${msg.content})`);

        let deleteStaffMsg = JSON.parse(msg.content);

        staffService.deleteStaff({staffId: deleteStaffMsg.staffId})
        .catch(error => {
            logger.error(error);
        });
    });

    logger.info(`${WORKER_NAME} listenting to ${NEW_PERSON_QUEUE_NAME}`);
    lipslideCommon.subscribe(NEW_PERSON_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_PERSON_QUEUE_NAME} event(${msg.content})`);

        let newPersonMsg = JSON.parse(msg.content);

        personService.newStaff({
            personId: newPersonMsg.personId,
            roles: newPersonMsg.roles
        })
        .catch(error => {
            logger.error(error);
        });
    });

    logger.info(`${WORKER_NAME} listenting to ${DELETE_PERSON_QUEUE_NAME}`);
    lipslideCommon.subscribe(DELETE_PERSON_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_PERSON_QUEUE_NAME} event(${msg.content})`);

        let deletePersonMsg = JSON.parse(msg.content);

        personService.deleteStaff({personId: deletePersonMsg.personId})
        .catch(error => {
            logger.error(error);
        });
    });

    logger.info(`${WORKER_NAME} listenting to ${NEW_OCCUPANCY_QUEUE_NAME}`);
    lipslideCommon.subscribe(NEW_OCCUPANCY_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_OCCUPANCY_QUEUE_NAME} event(${msg.content})`);

        const newOccupancyMsg = JSON.parse(msg.content);

        //only write BOOKING occupancy type to db. Ignor MAINTAINANCE
        if(newOccupancyMsg.occupancyType === "BOOKING"){
            const input = {
                occupancyId: newOccupancyMsg.occupancyId,
                referenceType: newOccupancyMsg.referenceType,
                referenceId: newOccupancyMsg.referenceId,
                status: newOccupancyMsg.status
            }
    
            occupancyService.newOccupancy(input)
            .catch(error => {
                logger.error(error);
            });
        }
    });

    logger.info(`${WORKER_NAME} listenting to ${DELETE_OCCUPANCY_QUEUE_NAME}`);
    lipslideCommon.subscribe(DELETE_OCCUPANCY_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${DELETE_OCCUPANCY_QUEUE_NAME} event(${msg.content})`);

        let deleteOccupancyMsg = JSON.parse(msg.content);

        occupancyService.deleteOccupancy({occupancyId: deleteOccupancyMsg.occupancyId})
        .catch(error => {
            logger.error(error);
        });
    });

    logger.info(`${WORKER_NAME} listing to ${CONFIRM_OCCUPANCY_QUEUE_NAME}`);
    lipslideCommon.subscribe(CONFIRM_OCCUPANCY_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${CONFIRM_OCCUPANCY_QUEUE_NAME} event(${msg.content})`);

        const confirmOccupancyMsg = JSON.parse(msg.content);

        const input = {
            occupancyId: confirmOccupancyMsg.occupancyId,
            referenceId: confirmOccupancyMsg.referenceId,
            status: confirmOccupancyMsg.status
        }
        occupancyService.updateOccupancy(input)
        .catch(error => {
            logger.error(error);
        });
    })
}

module.exports = {
    listen
}