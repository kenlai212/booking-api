const utility = require("../../../src/common/utility");
const {customError} = utility;

const partyHelper = require("../../../src/party/party.helper");
const { Party } = require("../../../src/party/party.model");

describe("Test party.helper.partyToOutputObj",() => {
    it("Valid Party Id",() => {
        let party = new Party();
        party._id = "123";
        
        const outputObj = partyHelper.partyToOutputObj(party)

        expect.assertions(1);
        expect(outputObj.id).toBeTruthy();
        
        return; 
    });

    it("personalInfo.name",() => {
        let party = new Party();
        party.personalInfo = {name: "tester"}

        const outputObj = partyHelper.partyToOutputObj(party);

        expect.assertions(5);
        expect(outputObj.personalInfo).toBeTruthy();
        expect(outputObj.personalInfo.name).toBeTruthy();
        expect(outputObj.personalInfo.name).toBe("tester");
        expect(outputObj.personalInfo.dob).not.toBeTruthy();
        expect(outputObj.personalInfo.gender).not.toBeTruthy();
        
        return; 
    });

    it("personalInfo.dob",() => {
        let party = new Party();
        const dob = new Date();
        party.personalInfo = {dob: dob}

        const outputObj = partyHelper.partyToOutputObj(party);

        expect.assertions(5);
        expect(outputObj.personalInfo).toBeTruthy();
        expect(outputObj.personalInfo.dob).toBeTruthy();
        expect(outputObj.personalInfo.dob).toBe(dob);
        expect(outputObj.personalInfo.name).not.toBeTruthy();
        expect(outputObj.personalInfo.gender).not.toBeTruthy();
        
        return; 
    });

    it("personalInfo.gender",() => {
        let party = new Party();
        party.personalInfo = {gender: "MALE"}

        const outputObj = partyHelper.partyToOutputObj(party)

        expect.assertions(5);
        expect(outputObj.personalInfo).toBeTruthy();
        expect(outputObj.personalInfo.gender).toBeTruthy();
        expect(outputObj.personalInfo.gender).toBe("MALE");
        expect(outputObj.personalInfo.name).not.toBeTruthy();
        expect(outputObj.personalInfo.dob).not.toBeTruthy();
        
        return; 
    });

    it("contact.emailAddress",() => {
        let party = new Party();
        party.contact = {emailAddress: "test@test.com"}

        const outputObj = partyHelper.partyToOutputObj(party)

        expect.assertions(5);
        expect(outputObj.contact).toBeTruthy();
        expect(outputObj.contact.emailAddress).toBeTruthy();
        expect(outputObj.contact.emailAddress).toBe("test@test.com");
        expect(outputObj.contact.telephoneCountryCode).not.toBeTruthy();
        expect(outputObj.contact.telephoneNumber).not.toBeTruthy();
        
        return; 
    });

    it("contact.telephoneCountryCode and telephoneNumber",() => {
        let party = new Party();
        party.contact = {telephoneCountryCode: "123", telephoneNumber: "4567890"}

        const outputObj = partyHelper.partyToOutputObj(party)

        expect.assertions(6);
        expect(outputObj.contact).toBeTruthy();
        expect(outputObj.contact.telephoneCountryCode).toBeTruthy();
        expect(outputObj.contact.telephoneNumber).toBeTruthy();
        expect(outputObj.contact.telephoneCountryCode).toBe("123");
        expect(outputObj.contact.telephoneNumber).toBe("4567890");
        expect(outputObj.contact.emailAddress).not.toBeTruthy();
        
        return; 
    });

    it("picture.url",() => {
        let party = new Party();
        party.picture = {url: "testerPic@test.com"}

        const outputObj = partyHelper.partyToOutputObj(party)

        expect.assertions(3);
        expect(outputObj.picture).toBeTruthy();
        expect(outputObj.picture.url).toBeTruthy();
        expect(outputObj.picture.url).toBe("testerPic@test.com");
        
        return; 
    });

    it("roles, preferredContactMethod, preferredLanguage",() => {
        let party = new Party();
        party.roles = ["A"];
        party.preferredContactMethod = "SMS",
        party.preferredLanguage = "en"

        const outputObj = partyHelper.partyToOutputObj(party)

        expect.assertions(5);
        expect(outputObj.roles).toBeTruthy();
        expect(outputObj.preferredContactMethod).toBeTruthy();
        expect(outputObj.preferredContactMethod).toBe("SMS");
        expect(outputObj.preferredLanguage).toBeTruthy();
        expect(outputObj.preferredLanguage).toBe("en");
        
        return; 
    });
});

describe("Test party.helper.getContactMethod",() => {
    it("party doesn't have contact, throw error",() => {
        let party = new Party();
        
        let throwError;
        try{
            partyHelper.getContactMethod(party)
        }catch(error){
            throwError = error;
        }

        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: `No contact method available` });

        return;
    });

    it("party doesn't have preferredContactMethod contact, default EMAIL",() => {
        let party = new Party();
        party.contact = {emailAddress : "tester@test.com"}

        expect.assertions(1);
        return expect(partyHelper.getContactMethod(party)).toEqual("EMAIL");
    });

    it("party has preferredContactMethod contact, expect SMS",() => {
        let party = new Party();
        party.contact = {emailAddress : "tester@test.com"}
        party.preferredContactMethod = "SMS"

        expect.assertions(1);
        return expect(partyHelper.getContactMethod(party)).toEqual("SMS");
    });
});

describe("Test party.helper.validatePartyId",() => {
    it("party.findById error, expect error", () => {
        Party.findById = jest.fn().mockRejectedValue(new Error("Party.findById error"));

        expect.assertions(1);

        return expect(partyHelper.validatePartyId("6033c2789440f647f077fb79")).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR, 
            message: "Find Party Error"
        });
    });

    it("no party found, expect error", () => {
        Party.findById = jest.fn().mockResolvedValue(null);

        expect.assertions(1);

        return expect(partyHelper.validatePartyId("6033c2789440f647f077fb79")).rejects.toEqual({
            name: customError.RESOURCE_NOT_FOUND_ERROR, 
            message: "Invalid partyId"
        });
    })
});