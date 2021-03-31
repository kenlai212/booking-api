const utility = require("../../../src/common/utility");
const {customError} = utility;

const personHelper = require("../../../src/person/person.helper");
const { Person } = require("../../../src/person/person.model");

describe("Test person.helper.validateRole", () => {
    it("null role, expect throw errror", () => {
        let throwError;
        try{
            personHelper.validateRole(null);
        }catch(error){
            throwError = error;
        }
        
        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: "Invalid role" });
    
        return;
    });

    it("invalid role, expect throw errror", () => {
        let throwError;
        try{
            personHelper.validateRole("A");
        }catch(error){
            throwError = error;
        }
        
        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: "Invalid role" });
    
        return;
    });

    it("CREW valid role, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateRole("CREW")).toEqual(true);
    });

    it("CUSTOMER valid role, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateRole("CUSTOMER")).toEqual(true);
    });

    it("ADMIN valid role, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateRole("ADMIN")).toEqual(true);
    });
});

describe("Test person.helper.validateContactMethod", () => {
    it("null contactMethod, expect throw errror", () => {
        let throwError;
        try{
            personHelper.validateContactMethod(null);
        }catch(error){
            throwError = error;
        }
        
        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: "Invalid contactMethod" });
    
        return;
    });

    it("invalid contactMethod, expect throw errror", () => {
        let throwError;
        try{
            personHelper.validateContactMethod("A");
        }catch(error){
            throwError = error;
        }
        
        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: "Invalid contactMethod" });
    
        return;
    });

    it("SMS valid contactMethod, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateContactMethod("SMS")).toEqual(true);
    });

    it("EMAIL valid contactMethod, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateContactMethod("EMAIL")).toEqual(true);
    });

    it("WHATSAPP valid contactMethod, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateContactMethod("WHATSAPP")).toEqual(true);
    });
});

describe("Test person.helper.validateLanguage", () => {
    it("null language, expect throw errror", () => {
        let throwError;
        try{
            personHelper.validateLanguage(null);
        }catch(error){
            throwError = error;
        }
        
        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: "Invalid language" });
    
        return;
    });

    it("invalid language, expect throw errror", () => {
        let throwError;
        try{
            personHelper.validateLanguage("A");
        }catch(error){
            throwError = error;
        }
        
        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: "Invalid language" });
    
        return;
    });

    it("zh-Hans valid language, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateLanguage("zh-Hans")).toEqual(true);
    });

    it("zh-Hant valid language, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateLanguage("zh-Hant")).toEqual(true);
    });

    it("en valid language, expect ture", () => {
        expect.assertions(1);
        expect(personHelper.validateLanguage("en")).toEqual(true);
    });
});

describe("Test person.helper.personToOutputObj",() => {
    it("Valid Person Id",() => {
        let person = new Person();
        person._id = "123";
        
        const outputObj = personHelper.personToOutputObj(person)

        expect.assertions(1);
        expect(outputObj.id).toBeTruthy();
        
        return; 
    });

    it("roles, preferredContactMethod, preferredLanguage",() => {
        let person = new Person();
        person.roles = ["A"];
        person.preferredContactMethod = "SMS",
        person.preferredLanguage = "en"

        const outputObj = personHelper.personToOutputObj(person)

        expect.assertions(5);
        expect(outputObj.roles).toBeTruthy();
        expect(outputObj.preferredContactMethod).toBeTruthy();
        expect(outputObj.preferredContactMethod).toBe("SMS");
        expect(outputObj.preferredLanguage).toBeTruthy();
        expect(outputObj.preferredLanguage).toBe("en");
        
        return; 
    });
});

describe("Test person.helper.getContactMethod",() => {
    it("person doesn't have contact, throw error",() => {
        let person = new Person();
        
        let throwError;
        try{
            personHelper.getContactMethod(person)
        }catch(error){
            throwError = error;
        }

        expect.assertions(1);
        expect(throwError).toEqual({ name: customError.BAD_REQUEST_ERROR, message: `No contact method available` });

        return;
    });

    it("person doesn't have preferredContactMethod contact, default EMAIL",() => {
        let person = new Person();
        person.contact = {emailAddress : "tester@test.com"}

        expect.assertions(1);
        return expect(personHelper.getContactMethod(person)).toEqual("EMAIL");
    });

    it("person has preferredContactMethod contact, expect SMS",() => {
        let person = new Person();
        person.contact = {emailAddress : "tester@test.com"}
        person.preferredContactMethod = "SMS"

        expect.assertions(1);
        return expect(personHelper.getContactMethod(person)).toEqual("SMS");
    });
});

describe("Test person.helper.getPerson",() => {
    it("invalid personId, expect error", () => {
        expect.assertions(1);

        return expect(personHelper.getPerson("1")).rejects.toEqual({
            name: customError.RESOURCE_NOT_FOUND_ERROR, 
            message: "Invalid personId"
        });
    });

    it("person.findById error, expect error", () => {
        Person.findById = jest.fn().mockRejectedValue(new Error("Person.findById error"));

        expect.assertions(1);

        return expect(personHelper.getPerson("6033c2789440f647f077fb79")).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR, 
            message: "Find Person Error"
        });
    });

    it("no person found, expect error", () => {
        Person.findById = jest.fn().mockResolvedValue(null);

        expect.assertions(1);

        return expect(personHelper.getPerson("6033c2789440f647f077fb79")).rejects.toEqual({
            name: customError.RESOURCE_NOT_FOUND_ERROR, 
            message: "Invalid personId"
        });
    })
});