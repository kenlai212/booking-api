const utility = require("../common/utility");
const { CrewMember } = require("./roster.model");
const {logger, customError} = utility;

function listen(){
    //listen to newStaff event. Add to local db
    const newStaffQueueName = "newStaff";
    utility.subscribe(newStaffQueueName, async function(msg){
        logger.info(`Heard ${newStaffQueueName} event(${msg})`);

        let newStaffMsg = JSON.parse(msg.content);

        let crewMember = new CrewMember();
        crewMember.staffId = newStaffMsg._id;
        crewMember.partyid = newStaffMsg.partyId

        try{
            await crewMember.save();
        }catch(error){
            logger.error("crewMember.save error : ", error);
		    throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save CrewMember Error" };
        }
    });

    //listen for crew assignment. Add to local db 
    const assignCrewQueueName = "assignCrew";
    utility.subscribe(assignCrewQueueName, async function(msg){
        logger.info(`Heard ${newStaffQueueName} event(${msg})`);

        let assignCrewMsg = JSON.parse(msg.content);

        let crewMember;
        try{
            crewMember = await CrewMember.findOne({staffId: assignCrewMsg.staffId});
        }catch(error){
            logger.error("CrewMember.findOne error : ", error);
		    throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Crew Member Error" };
        }

        if(!crewMember){
            throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid staffId" };
        }

        if(!crewMember.assignments)
            crewMember.assignments = [];

        crewMember.assignments.push({
            bookingId: assignCrewMsg.bookingId,
		    startTime: assignCrewMsg.startTime,
		    endTime: assignCrewMsg.endTime
        });

        try{
            await crewMember.save();
        }catch(error){
            logger.error("crewMember.save error : ", error);
		    throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Crew Member Error" };
        }
    });
}

module.exports = {
    listen
}