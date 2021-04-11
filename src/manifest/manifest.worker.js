"use strict";
const utility = require("../../common/utility");
const {logger} = utility;

const manifestDomain = require("./manifest.doman");

const NEW_BOOKING_QUEUE_NAME = "NEW_BOOKING";

function listen(){
    utility.subscribe(NEW_BOOKING_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_BOOKING_QUEUE_NAME} event(${msg})`);

        const msgJSON = JSON.parse(msg.content); 

        const input = {
            bookingId: msgJSON.bookingId,
            guests:[msgJSON.customerId]
        }

        try{
            await manifestDomain.newManifest(input, msgJSON.user);
        }catch(error){
            throw error;
        }
    });
}

module.exports = {
    listen
}