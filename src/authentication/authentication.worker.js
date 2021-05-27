const utility = require("../common/utility");
const {logger} = utility;

const claimService = require("./claim.service");

const WORKER_NAME = "AuthenticationWorker";

const NEW_USER_QUEUE_NAME = "NEW_USER";
const USER_STATUS_CHANGED_QUEUE_NAME = "USER_STATUS_CHANGED";
const USER_GROUPS_CHANGED_QUEUE_NAME = "USER_GROUPS_CHANGED";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${NEW_USER_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${USER_STATUS_CHANGED_QUEUE_NAME}`);
    logger.info(`${WORKER_NAME} listenting to ${USER_GROUPS_CHANGED_QUEUE_NAME}`);

    utility.subscribe(NEW_USER_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_USER_QUEUE_NAME} event(${msg})`);

        let newUserMsg = JSON.parse(msg.content);
        const user = newUserMsg.user;

        const input = {
            userId: user._id,
		    personId: user.personId,
            userStatus: user.status,
            groups: user.groups,
            roles: user.roles
        }
        
        await claimService.newClaim(input);
    });

    utility.subscribe( USER_STATUS_CHANGED_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${ USER_STATUS_CHANGED_QUEUE_NAME} event(${msg})`);

        let statusChangeMsg = JSON.parse(msg.content);

        const udpateStatusInput = {
            userId: statusChangeMsg._id,
            userStatus: statusChangeMsg.status
        }
        
        await claimService.updateStatus(udpateStatusInput);
    });

    utility.subscribe(USER_GROUPS_CHANGED_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${USER_GROUPS_CHANGED_QUEUE_NAME} event(${msg})`);

        let groupsChangeMsg = JSON.parse(msg.content);

        const updateGroupsInput = {
            userId: groupsChangeMsg._id,
            groups: groupsChangeMsg.groups
        }
        
        await claimService.updateGroups(updateGroupsInput);
    });
}

module.exports = {
    listen
}