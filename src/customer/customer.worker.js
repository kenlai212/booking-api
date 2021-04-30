const utility = require("../common/utility");
const {logger} = utility;

const personService = require("./person.service");

const WORKER_NAME = "CustomerWorker";

const NEW_PERSON_QUEUE_NAME = "NEW_PERSON";

function listen(){
    logger.info(`${WORKER_NAME} listenting to ${NEW_PERSON_QUEUE_NAME}`);

    utility.subscribe(NEW_PERSON_QUEUE_NAME, async function(msg){
        logger.info(`${WORKER_NAME} heard ${NEW_PERSON_QUEUE_NAME} event(${msg.content})`);

        let newPersonMsg = JSON.parse(msg.content);

        const newPersonInput = {
            personId: newPersonMsg._id,
            name: newPersonMsg.name,
            dob: newPersonMsg.dob,
            gender: newPersonMsg.gernder,
            phoneNumber: newPersonMsg.phoneNumber,
            countryCode: newPersonMsg.countryCode,
            emailAddress: newPersonMsg.emailAddress,
            profilePictureUrl: newPersonMsg.profilePictureUrl
        };

        await personService.newPerson(newPersonInput);
    });
}

module.exports = {
    listen
}