const utility = require("../common/utility");
const {logger, customError} = utility;

const partyService = require("./party.service");

const NEW_USER_QUEUE_NAME = "NEW_USER";

function listen(){
    utility.subscribe(NEW_USER_QUEUE_NAME, async function(msg){
        logger.info(`Person worker heard ${NEW_USER_QUEUE_NAME} event(${msg})`);

        let userRegisteredMsg = JSON.parse(msg.content);

        const input = {
            partyId: userRegisteredMsg.partyId,
            userId: userRegisteredMsg.userId
        }

        await partyService.updateUserId(input, msg.user);
    });
}

module.exports = {
    listen
}