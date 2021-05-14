const utility = require("../common/utility");
const {logger, customError} = utility;

const partyService = require("./party.service");

const WORKER_NAME = "PersonWorker"

const NEW_USER_QUEUE_NAME = "NEW_USER";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${NEW_USER_QUEUE_NAME}`);

    utility.subscribe(NEW_USER_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_USER_QUEUE_NAME} event(${msg})`);

        let userRegisteredMsg = JSON.parse(msg.content);

        const input = {
            partyId: userRegisteredMsg.partyId,
            userId: userRegisteredMsg.userId
        }

        partyService.updateUserId(input)
        .catch(error => {
            logger.error(error);
        });
    });
}

module.exports = {
    listen
}