const utility = require("../common/utility");
const {logger} = utility;

const claimService = require("./claim.service");

function listen(){
    const newUserQueueName = "newUser";

    utility.subscribe(newUserQueueName, async function(msg){
        logger.info(`Heard ${newUserQueueName} event(${msg})`);

        let newUserMsg = JSON.parse(msg.content);
        const user = newUserMsg.user;

        const input = {
            userId: user._id,
		    personId: user.personId,
            provider: user.provider,
            providerUserId: user.providerUserId,
            userStatus: user.status,
            groups: user.groups
        }
        
        await claimService.newClaim(input);
    });

    const userStatusChangeQueueName = "userStatusChange";

    utility.subscribe(userStatusChangeQueueName, async function(msg){
        logger.info(`Heard ${userStatusChangeQueueName} event(${msg})`);

        let msgContent = JSON.parse(msg.content);

        const input = {
            userId: msgContent._id,
            userStatus: msgContent.status
        }
        
        await claimService.updateStatus(input);
    });

    const userGroupsChangeQueueName = "userStatusChange";

    utility.subscribe(userStatusChangeQueueName, async function(msg){
        logger.info(`Heard ${userStatusChangeQueueName} event(${msg})`);

        let msgContent = JSON.parse(msg.content);

        const input = {
            userId: msgContent._id,
            groups: msgContent.groups
        }
        
        await claimService.updateStatus(input);
    });
}

module.exports = {
    listen
}