"use strict";
const config = require('config');

const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const staffService = require("./staff/staff.service");

const KAFKA_BOOKING_NEW_STAFF_GROUP = "booking-new-staff-group";

function listen(){
    lipslideCommon.subscribeToKafkaTopic(
        config.get("kafka.clientId"), 
        config.get("kafka.brokers").split(","), 
        KAFKA_BOOKING_NEW_STAFF_GROUP,
        config.get("kafka.topics.newStaff"), 
        value => {
            let newStaffMsg = JSON.parse(value);

            const newStaffInput = {
                staffId: newStaffMsg.staffId,
                status: newStaffMsg.status,
		        name: newStaffMsg.name,
                countryCode: newStaffMsg.countryCode,
		        phoneNumber: newStaffMsg.phoneNumber
            }

            staffService.newStaff(newStaffInput)
            .catch(error =>{
                logger.error(error);
            });
    });
}

module.exports = {
	listen
}