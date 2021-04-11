const utility = require("../common/utility");
const {logger} = utility;

const customerDomain = require("./customer.domain");

const NEW_CUSTOMER_QUEUE_NAME = "NEW_CUSTOMER";
const DELETE_CUSTOMER_QUEUE_NAME = "DELETE_CUSTOMER";

function listen(){
    utility.subscribe(NEW_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_CUSTOMER_QUEUE_NAME} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);

        const createCustomerInput = {
            customerId: jsonMsg.customerId
        }

        await customerDomain.createCustomer(createCustomerInput);
    });

    utility.subscribe(DELETE_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${DELETE_CUSTOMER_QUEUE_NAME} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);

        await customerDomain.deleteCustomer(jsonMsg.customerId);
    });
}

module.exports = {
    listen
}