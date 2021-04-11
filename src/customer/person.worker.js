const utility = require("../common/utility");
const {logger} = utility;

const personDomain = require("./person.domain");
const customerDomain = require("./customer.domain");
const customerService = require("./customer.service");

const NEW_PERSON_QUEUE_NAME = "NEW_PERSON";

function listen(){
    utility.subscribe(NEW_PERSON_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_PERSON_QUEUE_NAME} event(${msg})`);

        let newPersonMsg = JSON.parse(msg.content);
        const person = newPersonMsg.person;
        const customerId = newPersonMsg.customerId;

        try{
            await personDomain.createCustomerPerson(person);

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