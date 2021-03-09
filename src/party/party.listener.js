const utility = require("../common/utility");
const {logger, customError} = utility;

const partyService = require("./party.service");

function listen(){
    utility.subscribe("newUserRegistered", async function(msg){
        logger.info(`Heard newUserRegistered event(${msg})`);

        let userRegisteredMsg = JSON.parse(msg.content);

        let partyId;

        //if partyId is available, then it was an invited user registeration
        if(!userRegisteredMsg.partyId){
            const input = {
                userId: userRegisteredMsg.userId,
		        personalInfo: userRegisteredMsg.personalInfo,
		        contact: userRegisteredMsg.contact,
		        picture: userRegisteredMsg.picture
            }

            partyId = await partyService.createNewParty(input, msg.user)._id;
        }else{
            const input = {
                partyId: userRegisteredMsg.partyId,
                userId: userRegisteredMsg.userId
            }
            await partyService.updateUserId(input, msg.user);
        }
    });
}

module.exports = {
    listen
}