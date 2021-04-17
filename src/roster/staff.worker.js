const utility = require("../common/utility");
const {logger} = utility;

const staffDomain = require("./staff.domain");

const NEW_STAFF_QUEUE_NAME = "NEW_STAFF";
const ASSIGN_CREW_QUEUE_NAME = "ASSIGN_CREW";
const RELEAVE_CREW_QUEUE_NAME = "RELEAVE_CREW";

function listen(){
    //listen to newStaff event. Add to local db
    utility.subscribe(NEW_STAFF_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_STAFF_QUEUE_NAME} event(${msg})`);

        let newStaffMsg = JSON.parse(msg.content);

        await staffDomain.createStaff({staffId: newStaffMsg.staffId});
    });

    //listen for crew assignment. Add to local db 
    utility.subscribe(ASSIGN_CREW_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${ASSIGN_CREW_QUEUE_NAME} event(${msg})`);

        let assignCrewMsg = JSON.parse(msg.content);

        let staff = await staffDomain.readStaff(assignCrewMsg.staffId);

        if(!staff.assignments)
            staff.assignments = [];

        staff.assignments.push({
            bookingId: assignCrewMsg.bookingId,
		    startTime: assignCrewMsg.startTime,
		    endTime: assignCrewMsg.endTime
        });

        await staffDomain.updateStaff(staff);
    });

    //listen for releave crew. Add to local db 
    utility.subscribe(RELEAVE_CREW_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${RELEAVE_CREW_QUEUE_NAME} event(${msg})`);

        let releaveCrewMsg = JSON.parse(msg.content);

        let staff = await staffDomain.readStaff(releaveCrewMsg.staffId);

        staff.assignments.forEach(function (assignment, index, object) {
            if (assignment.bookingId === releaveCrewMsg.bookingId) {
                object.splice(index, 1);
            }
        });

        await staffDomain.updateStaff(staff);
    });
}

module.exports = {
    listen
}