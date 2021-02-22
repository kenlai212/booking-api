const customError = require("../../../src/common/customError");

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
        
        expect.assertions(1);
        
        return expect(partyHelper.getContactMethod(party)).toThrow({ 
            name: customError.BAD_REQUEST_ERROR, 
            message: `No contact method available` 
        });
    });
});