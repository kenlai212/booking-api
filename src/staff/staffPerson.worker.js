const utility = require("../common/utility");
const {logger} = utility;

const customerPersonService = require("./customerPerson.service");

function listen(){
    const newPersonQueueName = "newPerson";

    utility.subscribe(newPersonQueueName, async function(msg){
        logger.info(`Heard ${newPersonQueueName} event(${msg})`);

        let newPersonMsg = JSON.parse(msg.content);
        const person = newPersonMsg.person;

        await customerPersonService.newCustomerPerson(person);
    });
}

module.exports = {
    listen
}