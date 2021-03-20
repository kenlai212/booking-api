"use strict";
const utility = require("../../../src/common/utility");
const {customError} = utility;

const personService = require("../../../src/person/person.service");
const personHelper = require("../../../src/person/person.helper");
const {Person} = require("../../../src/person/person.model");

describe("Test person.service.createNewPerson",() => {
    let user = {};

    it("Missing personalInfo",() => {
        const input = {};

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personalInfo is required"
        });
    });

    it("Invalid role, expect reject",() => {
        const input = {
            personalInfo: {},
            role: "A"
        };

        //setup mock personHelper.validateRole, throw error
        personHelper.validateRole = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad role"
            }
        });

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad role"
        });
    });

    it("Invalid preferredContactMethod, expect reject",() => {
        const input = {
            personalInfo: {},
            preferredContactMethod: "A"
        };

        //setup mock personHelper.validateContactMethod, throw error
        personHelper.validateContactMethod = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad perferredContactMethod"
            }
        });

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad perferredContactMethod"
        });
    });

    it("Invalid preferredLanguage, expect reject",() => {
        const input = {
            personalInfo: {},
            preferredLanguage: "A"
        };

        //setup mock personHelper.validateLanguage, throw error
        personHelper.validateLanguage = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad perferredLanguage"
            }
        });

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad perferredLanguage"
        });
    });

    it("Invalid personalInfo, expect reject",() => {
        const input = {
            personalInfo: {}
        };

        //setup mock partyHelper.validatePersonalInfoInput, reject
        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad personalInfo object"
            }
        });

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad personalInfo object"
        });
    });

    it("Invalid contact, expect reject",() => {
        const input = {
            personalInfo: {},
            contact: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validateContactInput, reject
        personHelper.validateContactInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad contact object"
            }
        });

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad contact object"
        });
    });

    it("Invalid picture, expect reject",() => {
        const input = {
            personalInfo: {},
            picture: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validatePictureInput, reject
        personHelper.validatePictureInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad picture object"
            }
        });

        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad picture object"
        });
    });

    it("failed personHelper.save, expect reject", async () => {
        const input = {
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock person.savePerson, reject
        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
        
        expect.assertions(1);
        
        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.savePerson = jest.fn().mockResolvedValue(new Person());

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(personService.createNewPerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", async () => {
        const input = {
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });
        
        personHelper.savePerson = jest.fn().mockResolvedValue({
            _id: "123",
            personalInfo: {name: "tester"},
            contact: {emailAddress: "tester@test.com"},
            picture: {url: "pictureURL"}
        });

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const result = await personService.createNewPerson(input, user);
        
        expect.assertions(6);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Published event to newPerson queue`);
        expect(result.eventMsg._id).toBeTruthy();
        expect(result.eventMsg.personalInfo).toEqual({name: "tester"});
        expect(result.eventMsg.contact).toEqual({emailAddress: "tester@test.com"});
        expect(result.eventMsg.picture).toEqual({url: "pictureURL"});

        return;
    });
})

describe("Test person.service.editContact",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Misssing contact object in input, expect reject", () => {
        const input = {
            personId: "123"
        };

        expect.assertions(1);

        return expect(personService.editContact(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "contact is required"
        });
    });

    it("validate contact object failed, expect reject", () => {
        const input = {
            personId: "123",
            contact: {}
        };

        //setup mock personHelper.validateContactInput, reject
        personHelper.validateContactInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad contact object"
            }
        });

        expect.assertions(1);

        return expect(personService.editContact(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad contact object"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "123",
            contact: {}
        };

        personHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock personHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.editContact(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed person.savePerson, expect reject", () => {
        const input = {
            personId: "123",
            contact: {}
        };

        personHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);

        return expect(personService.editContact(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            personId: "123",
            contact: {}
        };

        personHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(personService.editContact(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", () => {
        const input = {
            personId: "123",
            contact: {}
        };

        personHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({contact: {emailAddress: "tester@test.com"}});

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        expect.assertions(1);

        return expect(personService.editContact(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to editPersonContact queue`,
		    eventMsg: {
                contact: {
                    emailAddress: "tester@test.com"
                }
            }
        });
    });
})

describe("Test person.service.editPersonalInfo",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Misssing personalInfo object in input, expect reject", () => {
        const input = {
            personId: "123"
        };

        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personalInfo is required"
        });
    });

    it("validate personalInfo object failed, expect reject", () => {
        const input = {
            personId: "123",
            personalInfo: {}
        };

        //setup mock personHelper.validatePersonalInfoInput, reject
        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad personalInfo object"
            }
          });

        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad personalInfo object"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "123",
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock personHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed person.save, expect reject", () => {
        const input = {
            personId: "123",
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            personId: "123",
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(personService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", async () => {
        const input = {
            personId: "123",
            personalInfo: {}
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({personalInfo: { name : "new tester name" }});
        
        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const result = await personService.editPersonalInfo(input, user);
        
        expect.assertions(3);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Published event to editPersonPersonalInfo queue`);
        expect(result.eventMsg.personalInfo).toEqual({name: "new tester name"});

        return;
    });
})

describe("Test person.service.editPicture", () => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.editPicture(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Misssing picture object in input, expect reject", () => {
        const input = {
            personId: "123"
        };

        expect.assertions(1);

        return expect(personService.editPicture(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "picture is required"
        });
    });

    it("validate picture object failed, expect reject", () => {
        const input = {
            personId: "123",
            picture: {}
        };

        //setup mock personHelper.validatePictureInput, reject
        personHelper.validatePictureInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad picture object"
            }
          });

        expect.assertions(1);

        return expect(personService.editPicture(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad picture object"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "123",
            picture: {}
        };

        personHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.editPicture(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed personHelper.savePerson, expect reject", () => {
        const input = {
            personId: "123",
            picture: {}
        };

        personHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
        
        expect.assertions(1);

        return expect(personService.editPicture(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            personId: "123",
            picture: {}
        };

        personHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(personService.editPicture(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", () => {
        const input = {
            personId: "123",
            picture: { url : "test.com" }
        };

        personHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({picture: { url : "test.com" }});

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        expect.assertions(1);

        return expect(personService.editPicture(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to editPersonPicture queue`,
		    eventMsg: {
                picture: { url : "test.com" }
            }
        });
    });
});

describe("Test person.service.addRole",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Misssing role in input, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role is required"
        });
    });

    it("Invalid role in input, expect reject", () => {
        const input = {
            personId: "1",
            role:"A"
        };

        //setup mock personHelper.validateRole, throw error
        personHelper.validateRole = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad role"
            }
        });

        expect.assertions(1);

        return expect(personService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad role"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        //setup mock partyHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.addRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("role alredy exist, expect reject", () => {
        const input = {
            personId: "1",
            role: "ADMIN"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        let person = new Person();
        person.roles = ["ADMIN"];

        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        expect.assertions(1);

        return expect(personService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This person is already in the ADMIN role"
        });
    });

    it("failed personHelper.savePerson, expect reject", () => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);

        return expect(personService.addRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("success!", async() => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue({_id: "1", roles: ["A"]});
        
        expect.assertions(1);

        return expect(personService.addRole(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Added A role to person(1)`,
            person: {_id: "1", roles: ["A"]}
        });;
    });
})

describe("Test person.service.removeRole",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Misssing role in input, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role is required"
        });
    });

    it("Invalid role in input, expect reject", () => {
        const input = {
            personId: "1",
            role:"A"
        };

        //setup mock personHelper.validateRole, throw error
        personHelper.validateRole = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad role"
            }
        });

        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad role"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        //setup mock personHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("person doesn't belong to any role, expect reject", () => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This person dosen't belong to the A role"
        });
    });

    it("person doesn't belong to the role to be remove, expect reject", () => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        //set roles to be CUSTOMER only.
        let person = new Person();
        person.roles = ["CUSTOMER"];
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This person dosen't belong to the A role"
        });
    });

    it("failed party.save, expect reject", () => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        let person = new Person();
        person.roles = ["A"];
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);

        return expect(personService.removeRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("success!", async() => {
        const input = {
            personId: "1",
            role: "A"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        let person = new Person();
        person.roles = ["A"];
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        personHelper.savePerson = jest.fn().mockResolvedValue({_id: "1"});
        
        expect.assertions(1);

        return expect(personService.removeRole(input, user)).resolves.toEqual({
            status : "SUCCESS",
            message: `Removed A role from person(1)`,
            person: {_id: "1"}
        });
    });
});

describe("Test person.service.sendMessage",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing message in input, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "body is required"
        });
    });

    it("Empty message string, expect reject", () => {
        const input = {
            personId: "1",
            body: ""
        };

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "body is not allowed to be empty"
        });
    });

    it("missing title in input, expect reject", () => {
        const input = {
            personId: "1",
            body: "A"
        };

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "title is required"
        });
    });

    it("Empty title string, expect reject", () => {
        const input = {
            personId: "1",
            body: "A",
            title: ""
        };

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "title is not allowed to be empty"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "1",
            body: "A",
            title:"B"
        };

        //setup mock personHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed partyHelper.getContactMethod, system error, expect reject", () => {
        const input = {
            personId: "1",
            body: "A",
            title:"B"
        };

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "no contact available"
            }
        });

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "no contact available"
        });
    });

    it("failed utility.publishEvent, system error, expect reject", () => {
        const input = {
            personId: "1",
            body: "A",
            title:"B"
        };

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            return "SMS"
        });

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
        });
    });

    it("success SMS", () => {
        const input = {
            personId: "1",
            body: "A",
            title:"B"
        };

        let person = new Person();
        person.contact = {
            telephoneCountryCode: "123",
            telephoneNumber: "4567890"
        }
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            return "SMS"
        });

        utility.publishEvent = jest.fn().mockImplementation(() => {return;});

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to sendSMS queue`,
		    eventMsg: {
                subject: "B",
				message: "A",
				number: "1234567890"
            }
        });
    });

    it("success Email", () => {
        const input = {
            personId: "1",
            body: "A",
            title:"B"
        };

        let person = new Person();
        person.contact = {
            emailAddress: "test@test.com"
        }
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            return "EMAIL"
        });

        utility.publishEvent = jest.fn().mockImplementation(() => {return;});

        expect.assertions(1);

        return expect(personService.sendMessage(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to sendEmail queue`,
		    eventMsg: {
                subject: "B",
				emailBody: "A",
				recipient: "test@test.com",
				sender: "admin@hebewake.com"
            }
        });
    });
});

describe("Test person.write.service.sendRegistrationInvite",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.sendRegistrationInvite(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "1"
        };

        //setup mock personHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.sendRegistrationInvite(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed personHelper.getContactMethod, system error, expect reject", () => {
        const input = {
            personId: "1"
        };

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "no contact available"
            }
        });

        expect.assertions(1);

        return expect(personService.sendRegistrationInvite(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "no contact available"
        });
    });

    it("failed utility.publishEvent, system error, expect reject", () => {
        const input = {
            personId: "1"
        };

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            return "SMS"
        });

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });

        expect.assertions(1);

        return expect(personService.sendRegistrationInvite(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
        });
    });

    it("success SMS", () => {
        const input = {
            personId: "1"
        };

        let person = new Person();
        person.contact = {
            telephoneCountryCode: "123",
            telephoneNumber: "4567890"
        }
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            return "SMS"
        });

        utility.publishEvent = jest.fn().mockImplementation(() => {return;});

        expect.assertions(1);

        return expect(personService.sendRegistrationInvite(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to sendSMS queue`,
		    eventMsg: {
                subject: "Registration Invite",
				message: "Please click on the following link to register",
				number: "1234567890"
            }
        });
    });

    it("success Email", () => {
        const input = {
            personId: "1"
        };

        let person = new Person();
        person.contact = {
            emailAddress: "test@test.com"
        }
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        personHelper.getContactMethod = jest.fn().mockImplementation(() => {
            return "EMAIL"
        });

        utility.publishEvent = jest.fn().mockImplementation(() => {return;});

        expect.assertions(1);

        return expect(personService.sendRegistrationInvite(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to sendEmail queue`,
		    eventMsg: {
                subject: "Registration Invite",
				emailBody: "Please click on the following link to register",
				recipient: "test@test.com",
				sender: "admin@hebewake.com"
            }
        });
    });
});

describe("Test person.write.service.deleteParty",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.deletePerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "6033c2789440f647f077fb79"
        };

        //setup mock partyHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.deletePerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed peson.findOneAndDelete, expect reject", () => {
        const input = {
            personId: "6033c2789440f647f077fb79"
        };

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        Person.findOneAndDelete = jest.fn().mockRejectedValue(new Error("party.findOneAndDelete error"));
        
        expect.assertions(1);

        return expect(personService.deletePerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Delete Person Error"
        });
    });

    it("failed publish event, expect reject", () => {
        const input = {
            personId: "6033c2789440f647f077fb79"
        };

        let person = new Person();
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        Person.findOneAndDelete = jest.fn().mockResolvedValue();
        
        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(personService.deletePerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });
});

describe("Test person.service.changePreferredContactMethod",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.changePreferredContactMethod(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing contactMethod, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personService.changePreferredContactMethod(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "contactMethod is required"
        });
    });

    it("Invalid contactMethod, expect reject", () => {
        const input = {
            personId: "1",
            contactMethod: "A"
        };

        //setup mock personHelper.validateContactMethod, throw error
        personHelper.validateContactMethod = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad perferredContactMethod"
            }
        });

        expect.assertions(1);

        return expect(personService.changePreferredContactMethod(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad perferredContactMethod"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "1",
            contactMethod: "A"
        };

        personHelper.validateContactMethod = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.changePreferredContactMethod(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed Party.save, expect reject", async () => {
        const input = {
            personId: "1",
            contactMethod: "A"
        };

        personHelper.validateContactMethod = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        //setup mock personHelper.savePerson, reject
        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);
        
        return expect(personService.changePreferredContactMethod(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("success!", async () => {
        const input = {
            personId: "1",
            contactMethod: "A"
        };

        personHelper.validateContactMethod = jest.fn().mockImplementation(() => { return true; });

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());
        
        personHelper.savePerson = jest.fn().mockResolvedValue({preferredContactMethod: "SMS"});

        const result = await personService.changePreferredContactMethod(input, user);
        
        expect.assertions(3);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Changed preferredContactMethod to A`);
        expect(result.person).toEqual({preferredContactMethod: "SMS"});

        return;
    });
});

describe("Test person.service.changePreferredLanguage",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personService.changePreferredLanguage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing language, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personService.changePreferredLanguage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "language is required"
        });
    });

    it("Invalid language, expect reject", () => {
        const input = {
            personId: "1",
            language: "A"
        };

        //setup mock personHelper.validateContactMethod, throw error
        personHelper.validateLanguage = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad language"
            }
        });

        expect.assertions(1);

        return expect(personService.changePreferredLanguage(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad language"
        });
    });

    it("failed validatePartyId(), system error, expect reject", () => {
        const input = {
            personId: "1",
            language: "A"
        };

        personHelper.validateLanguage = jest.fn().mockImplementation(() => {return true;});

        //setup mock personHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personService.changePreferredLanguage(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("failed personHelper.savePerson, expect reject", async () => {
        const input = {
            personId: "1",
            language: "A"
        };

        personHelper.validateLanguage = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        //setup mock personHelper.savePerson, reject
        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);
        
        return expect(personService.changePreferredLanguage(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("success!", async () => {
        const input = {
            personId: "1",
            language: "A"
        };

        personHelper.validateLanguage = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());
        
        personHelper.savePerson = jest.fn().mockResolvedValue({preferredLanguage: "en"});

        const result = await personService.changePreferredLanguage(input, user);
        
        expect.assertions(3);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Changed preferredLanguage to A`);
        expect(result.party).toEqual({preferredLanguage: "en"});

        return;
    });
})