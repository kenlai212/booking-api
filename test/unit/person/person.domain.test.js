"use strict";
const utility = require("../../../src/common/utility");
const {customError} = utility;

const personDomain = require("../../../src/person/person.domain");
const personHelper = require("../../../src/person/person.helper");
const {Person} = require("../../../src/person/person.model");

describe("Test person.service.createPerson",() => {
    let user = {};

    it("Missing name",() => {
        const input = {};

        expect.assertions(1);

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "name is required"
        });
    });

    it("Invalid dob, expect reject",() => {
        const input = {
            name: "A",
            dob: "A"
        };

        //setup mock personHelper.validateDob, throw error
        personHelper.validateDob = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad dob"
            }
        });

        expect.assertions(1);

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "dob must be in ISO 8601 date format"
        });
    });

    it("Invalid gender, expect reject",() => {
        const input = {
            name: "A",
            gender: "A"
        };

        //setup mock personHelper.validateGender, throw error
        personHelper.validateGender = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad gender"
            }
        });

        expect.assertions(1);

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad gender"
        });
    });

    it("Invalid phoneNumber, expect reject",() => {
        const input = {
            name: "A",
            phoneNumber: "A"
        };

        //setup mock personHelper.validatePhoneNumber, throw error
        personHelper.validatePhoneNumber = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad phoneNumber"
            }
        });

        expect.assertions(1);

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad phoneNumber"
        });
    });

    it("Invalid emailAddress, expect reject",() => {
        const input = {
            name: "A",
            emailAddress: "A"
        };

        //setup mock personHelper.validateEmailAddress, throw error
        personHelper.validateEmailAddress = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad emailAddress"
            }
        });

        expect.assertions(1);

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad emailAddress"
        });
    });

    it("Invalid role, expect reject",() => {
        const input = {
            name: "A",
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

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad role"
        });
    });

    it("Invalid preferredContactMethod, expect reject",() => {
        const input = {
            name: "A",
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

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad perferredContactMethod"
        });
    });

    it("Invalid preferredLanguage, expect reject",() => {
        const input = {
            name: "A",
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

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad perferredLanguage"
        });
    });

    it("failed personHelper.save, expect reject", async () => {
        const input = {
            name: "A"
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock person.savePerson, reject
        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
        
        expect.assertions(1);
        
        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            name: "A"
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

        return expect(personDomain.createPerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", async () => {
        const input = {
            name: "A"
        };

        personHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });
        
        personHelper.savePerson = jest.fn().mockResolvedValue({
            _id: "123",
            personalInfo: {name: "tester"},
            contact: {emailAddress: "tester@test.com"},
            picture: {url: "pictureURL"}
        });

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const result = await personDomain.createPerson(input, user);
        
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

describe("Test person.service.updateRoles",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Misssing role in input, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role is required"
        });
    });

    it("Misssing action in input, expect reject", () => {
        const input = {
            personId: "1",
            role:"A"
        };

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "action is required"
        });
    });

    it("Invalid action in input, expect reject", () => {
        const input = {
            personId: "1",
            role:"A",
            action: "A"
        };

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "action must be one of [ADD, REMOVE]"
        });
    });

    it("Invalid role in input, expect reject", () => {
        const input = {
            personId: "1",
            role:"A",
            action: "ADD"
        };

        //setup mock personHelper.validateRole, throw error
        personHelper.validateRole = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad role"
            }
        });

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad role"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
        const input = {
            personId: "1",
            role: "A",
            action: "ADD"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        //setup mock partyHelper.getPerson system, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
        
        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("Add role, role alredy exist, expect reject", () => {
        const input = {
            personId: "1",
            role: "ADMIN",
            action: "ADD"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        let person = new Person();
        person.roles = ["ADMIN"];

        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This person is already in the ADMIN role"
        });
    });

    it("Remove role, person doesn't belong to any role, expect reject", () => {
        const input = {
            personId: "1",
            role: "A",
            action: "REMOVE"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This person dosen't belong to the A role"
        });
    });

    it("Remove role, person doesn't belong to the role to be remove, expect reject", () => {
        const input = {
            personId: "1",
            role: "A",
            action: "REMOVE"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        //set roles to be CUSTOMER only.
        let person = new Person();
        person.roles = ["CUSTOMER"];
        personHelper.getPerson = jest.fn().mockResolvedValue(person);

        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This person dosen't belong to the A role"
        });
    });

    it("failed personHelper.savePerson, expect reject", () => {
        const input = {
            personId: "1",
            role: "A",
            action: "ADD"
        };

        personHelper.validateRole = jest.fn().mockImplementation(() => {return true;});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
        
        expect.assertions(1);

        return expect(personDomain.updateRoles(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });
})

describe("Test person.service.deletePerson",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personDomain.deletePerson(input, user)).rejects.toEqual({
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

        return expect(personDomain.deletePerson(input, user)).rejects.toEqual({
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

        return expect(personDomain.deletePerson(input, user)).rejects.toEqual({
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

        return expect(personDomain.deletePerson(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });
});

describe("Test person.service.updatePreferredContactMethod",() => {
    let user = {};

    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personDomain.updatePreferredContactMethod(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing contactMethod, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personDomain.updatePreferredContactMethod(input, user)).rejects.toEqual({
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

        return expect(personDomain.updatePreferredContactMethod(input, user)).rejects.toEqual({
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

        return expect(personDomain.updatePreferredContactMethod(input, user)).rejects.toEqual({
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
        
        return expect(personDomain.updatePreferredContactMethod(input, user)).rejects.toEqual({
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

        const result = await personDomain.updatePreferredContactMethod(input, user);
        
        expect.assertions(3);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Changed preferredContactMethod to A`);
        expect(result.person).toEqual({preferredContactMethod: "SMS"});

        return;
    });
});

describe("Test person.service.updatePreferredLanguage",() => {
    it("Misssing personId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(personDomain.updatePreferredLanguage(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing language, expect reject", () => {
        const input = {
            personId: "1"
        };

        expect.assertions(1);

        return expect(personDomain.updatePreferredLanguage(input)).rejects.toEqual({
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

        return expect(personDomain.updatePreferredLanguage(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad language"
        });
    });

    it("failed getPerson(), system error, expect reject", () => {
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

        return expect(personDomain.updatePreferredLanguage(input)).rejects.toEqual({
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
            message: "Save Person Error"
        });
        
        expect.assertions(1);
        
        return expect(personDomain.updatePreferredLanguage(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
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

        const result = await personDomain.updatePreferredLanguage(input);
        
        expect.assertions(3);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Changed preferredLanguage to A`);
        expect(result.party).toEqual({preferredLanguage: "en"});

        return;
    });
})

describe("Test person.service.updateMobile", () => {
    it("Missing personId, expect reject", () => {
        const input = {}

        expect.assertions(1);
        
        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing phoneNumber, expect reject", () => {
        const input = {
            personId: "A"
        }

        expect.assertions(1);
        
        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "phoneNumber is required"
        });
    });

    it("Missing countryCode, expect reject", () => {
        const input = {
            personId: "A",
            phoneNumber: "1"
        }

        expect.assertions(1);
        
        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "countryCode is required"
        });
    });

    it("fail personHelper.validatePhoneNumber, expect reject", async () => {
        const input = {
            personId: "A",
            phoneNumber: "1",
            countryCode: "1"
        }

        //setup mock personHelper.validatePhoneNumber, to reject with system error.
        personHelper.validatePhoneNumber = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad phoneNumber"
            }
        });

        expect.assertions(1);

        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad phoneNumber"
        });
    });

    it("fail personHelper.getPerson, expect reject", () => {
        const input = {
            personId: "A",
            phoneNumber: "1",
            countryCode: "1"
        }

        personHelper.validatePhoneNumber = jest.fn().mockImplementation(() => {return true});

        //setup mock personHelper.getPerson, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });

        expect.assertions(1);

        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("fail personHelper.savePerson, expect reject", () => {
        const input = {
            personId: "A",
            phoneNumber: "1",
            countryCode: "1"
        }

        personHelper.validatePhoneNumber = jest.fn().mockImplementation(() => {return true});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        //setup mock personHelper.savePerson, reject
        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });

        expect.assertions(1);

        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
    });

    it("fail publishEvent, expect reject", () => {
        const input = {
            personId: "A",
            phoneNumber: "1",
            countryCode: "1"
        }

        personHelper.validatePhoneNumber = jest.fn().mockImplementation(() => {return true});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue(new Person());

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });

        expect.assertions(1);

        return expect(personDomain.updateMobile(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });
})

describe("Test person.service.updateEmailAddress", () => {
    it("Missing personId, expect reject", () => {
        const input = {}

        expect.assertions(1);
        
        return expect(personDomain.updateEmailAddress(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Missing emailAddress, expect reject", () => {
        const input = {
            personId: "A"
        }

        expect.assertions(1);
        
        return expect(personDomain.updateEmailAddress(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "emailAddress is required"
        });
    });

    it("fail personHelper.validateEmailAddress, expect reject", () => {
        const input = {
            personId: "A",
            emailAddress: "A"
        }

        //setup mock personHelper.validateEmailAddress, to reject with system error.
        personHelper.validateEmailAddress = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad emailAddress"
            }
        });

        expect.assertions(1);

        return expect(personDomain.updateEmailAddress(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad emailAddress"
        });
    });

    it("fail personHelper.getPerson, expect reject", async () => {
        const input = {
            personId: "A",
            emailAddress: "A"
        }

        personHelper.validateEmailAddress = jest.fn().mockImplementation(() => {return true});

        //setup mock personHelper.getPerson, to reject with system error.
        personHelper.getPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });

        expect.assertions(1);

        return expect(personDomain.updateEmailAddress(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "getPerson System Error"
        });
    });

    it("fail personHelper.savePerson, expect reject", async () => {
        const input = {
            personId: "A",
            emailAddress: "A"
        }

        personHelper.validateEmailAddress = jest.fn().mockImplementation(() => {return true});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        //setup mock personHelper.savePerson, reject
        personHelper.savePerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });

        expect.assertions(1);

        return expect(personDomain.updateEmailAddress(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Person Error"
        });
    });

    it("fail publishEvent, expect reject", async () => {
        const input = {
            personId: "A",
            emailAddress: "A"
        }

        personHelper.validateEmailAddress = jest.fn().mockImplementation(() => {return true});

        personHelper.getPerson = jest.fn().mockResolvedValue(new Person());

        personHelper.savePerson = jest.fn().mockResolvedValue(new Person());

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });

        expect.assertions(1);

        return expect(personDomain.updateEmailAddress(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });
});

describe("Test person.service.updateName", () => {
    it("missing personId, expect reject", () => {
        
    });
});