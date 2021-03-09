const utility = require("../common/utility");
const {logger, customError} = utility;

function listen(){
    const newCustomerQueueName = "newCustomer";

    utility.subscribe(newCustomerQueueName, async function(msg){
        logger.info(`Heard ${newCustomerQueueName} event(${msg})`);

        let newCustomerMsg = JSON.parse(msg.content);

        let guest = new Guest();
        guest.customerId = newCustomerMsg._id;
        guest.partyid = newCustomerMsg.partyId

        try{
            await guest.save();
        }catch(error){
            logger.error("guest.save error : ", error);
		    throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Guest Error" };
        }
    });
}

module.exports = {
    listen
}