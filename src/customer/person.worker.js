const utility = require("../common/utility");
const {logger} = utility;

const personDomain = require("./person.domain");
const customerService = require("./customer.service");

const NEW_PERSON_QUEUE_NAME = "NEW_PERSON";

function listen(){
    utility.subscribe(NEW_PERSON_QUEUE_NAME, async function(msg){
        logger.info(`Heard ${NEW_PERSON_QUEUE_NAME} event(${msg})`);

        let newPersonMsg = JSON.parse(msg.content);
        const person = newPersonMsg.person;

        const createPersonInput = {
            personId: person.personId,
            name: person.name,
            dob: person.dob,
            gender: person.gernder,
            phoneNumber: person.phoneNumber,
            countryCode: person.countryCode,
            emailAddress: person.emailAddress,
            profilePictureUrl: person.profilePictureUrl,
            roles: person.roles
        };

        //save person to db
        try{
            await personDomain.createPerson(createPersonInput);
        }catch(error){
            throw error;
        }

        //if person belongs to CUSTOMER role, update personId in customer record
        person.roles.forEach(role => {
            if(role.roleName === "CUSTOMER"){
                await customerService.updatePersonId({"customerId": role.referenceId, "personId": person.personId});
            }
        });
    });
}

module.exports = {
    listen
}