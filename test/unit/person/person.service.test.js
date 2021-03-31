"use strict";
const utility = require("../../../src/common/utility");
const {customError} = utility;

const personService = require("../../../src/person/person.service");
const personHelper = require("../../../src/person/person.helper");
const {Person} = require("../../../src/person/person.model");

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
        person.countryCode = "123";
        person.phoneNumber = "4567890";
        
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
        person.emailAddress = "test@test.com";

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
        person.countryCode = "123";
        person.phoneNumber = "4567890";
        
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
        person.emailAddress = "test@test.com";
        
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