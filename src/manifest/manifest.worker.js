"use strict";
const utility = require("../common/utility");
const {logger} = utility;

const manifestService = require("./manifest.service");
const customerService = require("./customer.service");

const WORKER_NAME = "ManifestWorker";

const NEW_BOOKING_QUEUE_NAME = "NEW_BOOKING";
const NEW_CUSTOMER_QUEUE_NAME = "NEW_CUSTOMER";
const DELETE_CUSTOMER_QUEUE_NAME = "DELETE_CUSTOMER";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${NEW_BOOKING_QUEUE_NAME}`);

    utility.subscribe(NEW_BOOKING_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_BOOKING_QUEUE_NAME} event(${msg})`);

        const msgJSON = JSON.parse(msg.content); 

        const input = {
            bookingId: msgJSON.bookingId,
            guests:[msgJSON.customerId]
        }

        try{
            await manifestService.newManifest(input, msgJSON.user);
        }catch(error){
            throw error;
        }
    });

    logger.info(`${WORKER_NAME} listenting to ${NEW_CUSTOMER_QUEUE_NAME}`);

    utility.subscribe(NEW_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_CUSTOMER_QUEUE_NAME} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);

        const createCustomerInput = {
            customerId: jsonMsg.customerId,
            personId: jsonMsg.personId,
            name: jsonMsg.name,
            gender: jsonMsg.gender,
	        phoneNumber: jsonMsg.phoneNumber,
	        countryCode: jsonMsg.countryCode,
	        emailAddress: jsonMsg.emailAddress,
	        profilePictureUrl: jsonMsg.profilePictureUrl
        }

        await customerService.newsCustomer(createCustomerInput);
    });

    logger.info(`${WORKER_NAME} listenting to ${DELETE_CUSTOMER_QUEUE_NAME}`);

    utility.subscribe(DELETE_CUSTOMER_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${DELETE_CUSTOMER_QUEUE_NAME} event(${msg})`);

        let jsonMsg = JSON.parse(msg.content);

        await customerService.deleteCustomer(jsonMsg.customerId);
    });
}

module.exports = {
    listen
}