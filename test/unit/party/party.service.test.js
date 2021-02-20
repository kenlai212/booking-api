const rewire = require("rewire");

const customError = require("../../../src/common/customError");
const utility = require("../../../src/common/utility");

const partyService = require("../../../src/party/party.service");
const partyHelper = require("../../../src/party/party.helper");
const {Party} = require("../../../src/party/party.model");

describe("Test party.service.createNewParty",() => {
    let user = {};

    it("Missing personalInfo",() => {
        const input = {};

        expect.assertions(1);

        return expect(partyService.createNewParty(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personalInfo is required"
        });
    });

    it("Invalid personalInfo, expect reject",() => {
        const input = {
            personalInfo: {}
        };

        //setup mock partyHelper.validatePersonalInfoInput, reject
        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad personalInfo object"
            }
        });

        expect.assertions(1);

        return expect(partyService.createNewParty(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad personalInfo object"
        });
    });

    it("Invalid contact, expect reject",() => {
        const input = {
            personalInfo: {},
            contact: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validateContactInput, reject
        partyHelper.validateContactInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad contact object"
            }
        });

        expect.assertions(1);

        return expect(partyService.createNewParty(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad contact object"
        });
    });

    it("Invalid picture, expect reject",() => {
        const input = {
            personalInfo: {},
            picture: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validatePictureInput, reject
        partyHelper.validatePictureInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad picture object"
            }
        });

        expect.assertions(1);

        return expect(partyService.createNewParty(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad picture object"
        });
    });

    it("failed Party.save, expect reject", async () => {
        const input = {
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock party.save, reject
        Party.prototype.save = jest.fn().mockRejectedValue(new Error("party.save error"));
        
        expect.assertions(1);
        
        return expect(partyService.createNewParty(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        Party.prototype.save = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(partyService.createNewParty(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", async () => {
        const input = {
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });
        
        Party.prototype.save = jest.fn().mockResolvedValue({
            _id: "123",
            personalInfo: {name: "tester"},
            contact: {emailAddress: "tester@test.com"},
            picture: {url: "pictureURL"}
        });

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const result = await partyService.createNewParty(input, user);
        
        expect.assertions(6);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Published event to newParty queue`);
        expect(result.newPartyEventMsg._id).toBeTruthy();
        expect(result.newPartyEventMsg.personalInfo).toEqual({name: "tester"});
        expect(result.newPartyEventMsg.contact).toEqual({emailAddress: "tester@test.com"});
        expect(result.newPartyEventMsg.picture).toEqual({url: "pictureURL"});

        return;
    });
})

describe("Test party.service.editContact",() => {
    let user = {};

    it("Misssing partyId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyId is required"
        });
    });

    it("Misssing contact object in input, expect reject", () => {
        const input = {
            partyId: "123"
        };

        expect.assertions(1);

        return expect(partyService.editContact(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "contact is required"
        });
    });

    it("validate contact object failed, expect reject", () => {
        const input = {
            partyId: "123",
            contact: {}
        };

        //setup mock partyHelper.validateContactInput, reject
        partyHelper.validateContactInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad contact object"
            }
        });

        expect.assertions(1);

        return expect(partyService.editContact(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad contact object"
        });
    });

    it("failed validatePartyId(), system error, expect reject", () => {
        const input = {
            partyId: "123",
            contact: {}
        };

        partyHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validatePartyId system, to reject with system error.
        partyHelper.validatePartyId = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
        
        expect.assertions(1);

        return expect(partyService.editContact(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
    });

    it("failed party.save, expect reject", () => {
        const input = {
            partyId: "123",
            contact: {}
        };

        partyHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockRejectedValue(new Error("party.save error"));
        
        expect.assertions(1);

        return expect(partyService.editContact(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            partyId: "123",
            contact: {}
        };

        partyHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(partyService.editContact(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", () => {
        const input = {
            partyId: "123",
            contact: {}
        };

        partyHelper.validateContactInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({contact: {emailAddress: "tester@test.com"}});

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        expect.assertions(1);

        return expect(partyService.editContact(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to editPartyContact queue`,
		    editPartyContactEventMsg: {
                contact: {
                    emailAddress: "tester@test.com"
                }
            }
        });
    });
})

describe("Test party.service.editPersonalInfo",() => {
    let user = {};

    it("Misssing partyId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyId is required"
        });
    });

    it("Misssing personalInfo object in input, expect reject", () => {
        const input = {
            partyId: "123"
        };

        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personalInfo is required"
        });
    });

    it("validate personalInfo object failed, expect reject", () => {
        const input = {
            partyId: "123",
            personalInfo: {}
        };

        //setup mock partyHelper.validatePersonalInfoInput, reject
        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad personalInfo object"
            }
          });

        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad personalInfo object"
        });
    });

    it("failed validatePartyId(), system error, expect reject", () => {
        const input = {
            partyId: "123",
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validatePartyId system, to reject with system error.
        partyHelper.validatePartyId = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
        
        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
    });

    it("failed party.save, expect reject", () => {
        const input = {
            partyId: "123",
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockRejectedValue(new Error("party.save error"));
        
        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            partyId: "123",
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(partyService.editPersonalInfo(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", async () => {
        const input = {
            partyId: "123",
            personalInfo: {}
        };

        partyHelper.validatePersonalInfoInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({personalInfo: { name : "new tester name" }});
        
        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const result = await partyService.editPersonalInfo(input, user);
        
        expect.assertions(3);
        expect(result.status).toEqual("SUCCESS");
        expect(result.message).toEqual(`Published event to editPartyPersonalInfo queue`);
        expect(result.editPartyPersonalInfoEventMsg.personalInfo).toEqual({name: "new tester name"});

        return;
    });
})

describe("Test party.service.editPicture", () => {
    let user = {};

    it("Misssing partyId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyId is required"
        });
    });

    it("Misssing picture object in input, expect reject", () => {
        const input = {
            partyId: "123"
        };

        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "picture is required"
        });
    });

    it("validate picture object failed, expect reject", () => {
        const input = {
            partyId: "123",
            picture: {}
        };

        //setup mock partyHelper.validatePictureInput, reject
        partyHelper.validatePictureInput = jest.fn().mockImplementation(() => {
            throw {
                name: customError.BAD_REQUEST_ERROR,
                message: "bad picture object"
            }
          });

        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bad picture object"
        });
    });

    it("failed validatePartyId(), system error, expect reject", () => {
        const input = {
            partyId: "123",
            picture: {}
        };

        partyHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        //setup mock partyHelper.validatePartyId system, to reject with system error.
        partyHelper.validatePartyId = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
        
        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
    });

    it("failed party.save, expect reject", () => {
        const input = {
            partyId: "123",
            picture: {}
        };

        partyHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockRejectedValue(new Error("party.save error"));
        
        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("failed utility.publishEvent, expect reject", () => {
        const input = {
            partyId: "123",
            picture: {}
        };

        partyHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({});

        //setup mock utility.publishEvent to fail
        utility.publishEvent = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "publish event error"
            }
        });
        
        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success!", () => {
        const input = {
            partyId: "123",
            picture: { url : "test.com" }
        };

        partyHelper.validatePictureInput = jest.fn().mockImplementation(() => { return true; });

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({picture: { url : "test.com" }});

        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        expect.assertions(1);

        return expect(partyService.editPicture(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Published event to editPartyPicture queue`,
		    editPartyPictureEventMsg: {
                picture: { url : "test.com" }
            }
        });
    });
});

describe("Test party.service.addRole",() => {
    let user = {};

    it("Misssing partyId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(partyService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyId is required"
        });
    });

    it("Misssing role in input, expect reject", () => {
        const input = {
            partyId: "1"
        };

        expect.assertions(1);

        return expect(partyService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role is required"
        });
    });

    it("Invalid role in input, expect reject", () => {
        const input = {
            partyId: "1",
            role:"A"
        };

        expect.assertions(1);

        return expect(partyService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role must be one of [CREW, CUSTOMER, ADMIN]"
        });
    });

    it("failed validatePartyId(), system error, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        //setup mock partyHelper.validatePartyId system, to reject with system error.
        partyHelper.validatePartyId = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
        
        expect.assertions(1);

        return expect(partyService.addRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
    });

    it("role alredy exist, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        let party = new Party();
        party.roles = ["ADMIN"];

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(party);

        expect.assertions(1);

        return expect(partyService.addRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This party is already in the ADMIN role"
        });
    });

    it("failed party.save, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockRejectedValue(new Error("party.save error"));
        
        expect.assertions(1);

        return expect(partyService.addRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("success!", async() => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(new Party());

        Party.prototype.save = jest.fn().mockResolvedValue({_id: "1", roles: ["ADMIN"]});
        
        expect.assertions(1);

        return expect(partyService.addRole(input, user)).resolves.toEqual({
            status : "SUCCESS",
		    message: `Added ADMIN role to party(1)`,
            party: {_id: "1", roles: ["ADMIN"]}
        });;
    });
})

describe("Test party.service.removeRole",() => {
    let user = {};

    it("Misssing partyId in input, expect reject", () => {
        const input = {};

        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyId is required"
        });
    });

    it("Misssing role in input, expect reject", () => {
        const input = {
            partyId: "1"
        };

        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role is required"
        });
    });

    it("Invalid role in input, expect reject", () => {
        const input = {
            partyId: "1",
            role:"A"
        };

        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "role must be one of [CREW, CUSTOMER, ADMIN]"
        });
    });

    it("failed validatePartyId(), system error, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        //setup mock partyHelper.validatePartyId system, to reject with system error.
        partyHelper.validatePartyId = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
        
        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "validatePartyId System Error"
        });
    });

    it("party doesn't belong to any role, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        let party = new Party();

        partyHelper.validatePartyId = jest.fn().mockResolvedValue(party);

        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This party dosen't belong to the ADMIN role"
        });
    });

    it("party doesn't belong to the role to be remove, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        //set roles to be CUSTOMER only.
        let party = new Party();
        party.roles = ["CUSTOMER"];
        partyHelper.validatePartyId = jest.fn().mockResolvedValue(party);

        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "This party dosen't belong to the ADMIN role"
        });
    });

    it("failed party.save, expect reject", () => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        let party = new Party();
        party.roles = ["ADMIN"];
        partyHelper.validatePartyId = jest.fn().mockResolvedValue(party);

        Party.prototype.save = jest.fn().mockRejectedValue(new Error("party.save error"));
        
        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save Party Error"
        });
    });

    it("success!", async() => {
        const input = {
            partyId: "1",
            role: "ADMIN"
        };

        let party = new Party();
        party.roles = ["ADMIN"];
        partyHelper.validatePartyId = jest.fn().mockResolvedValue(party);

        Party.prototype.save = jest.fn().mockResolvedValue({_id: "1"});
        
        expect.assertions(1);

        return expect(partyService.removeRole(input, user)).resolves.toEqual({
            status : "SUCCESS",
            message: `Removed ADMIN role from party(1)`,
            party: {_id: "1"}
        });;
    });
})