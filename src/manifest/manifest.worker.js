"use strict";
const utility = require("../../common/utility");
const {logger} = utility;

const manifestService = require("./manifest.service");

function listen(){
    const newBookingQueueName = "newBooking";

    utility.subscribe(newBookingQueueName, async function(msg){
        logger.info(`Heard ${newBookingQueueName} event(${msg})`);

        const msgJSON = JSON.parse(msg.content); 
        let input = msgJSON.booking;
        let user = msgJSON.user;

        try{
            await manifestService.newManifest(input,user);
        }catch(error){
            throw error;
        }
    });
}

module.exports = {
    listen
}