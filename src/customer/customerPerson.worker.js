const utility = require("../common/utility");
const {logger} = utility;

const customerPersonDomain = require("./customerPerson.domain");
const customerDomain = require("./customer.domain");
const customerService = require("./customer.service");

function listen(){
    const newPersonQueueName = "newPerson";

    utility.subscribe(newPersonQueueName, async function(msg){
        logger.info(`Heard ${newPersonQueueName} event(${msg})`);

        let newPersonMsg = JSON.parse(msg.content);
        const person = newPersonMsg.person;
        const customerId = newPersonMsg.customerId;

        try{
            await customerPersonDomain.createCustomerPerson(person);

            await customerDomain.updatePersonId({"customerId": customerId, "personId": person.id});
    
            await customerService.completeNewCustomerRequest({"customerId": customerId, "personId": person.id});
        }catch(error){
            throw error;
        }
        
    });
}

module.exports = {
    listen
}