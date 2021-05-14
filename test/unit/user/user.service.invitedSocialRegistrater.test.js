const utility = require("../../../src/common/utility");
const {customError} = utility;

const registration = require("../../../src/user/registration.service");
const personDomain = require("../../../src/user/person.domain");
const userDomain = require("../../../src/user/user.domain");
const registrationHelper = require("../../../src/user/registration.helper");
const { Person, User } = require("../../../src/user/user.model");


describe("Test user.registration.service.invitedSocialRegister",() => {
    it("Missing provider",() => {
        const input = {};

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "provider is required"
        });
    });

    it("Missing providerToken",() => {
        const input = {
            provider: "A"
        };

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "providerToken is required"
        });
    });

    it("Missing personId",() => {
        const input = {
            provider: "A",
            providerToken: "B"
        };

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("Invalid personId",() => {
        const input = {
            provider: "A",
            providerToken: "B",
            personId:"C"
        };

        personDomain.readPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read Person Error"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read Person Error"
        });
    });

    it("Invalid provider",() => {
        const input = {
            provider: "A",
            providerToken: "B",
            personId:"C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid Provider"
        });
    });

    it("registrationHelper.getSocialProfileFromFacebook error, reject",() => {
        const input = {
            provider: "FACEBOOK",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromFacebook = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Facebook Graph API Error"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Facebook Graph API Error"
        });
    });

    it("registrationHelper.getSocialProfileFromGoogle error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Google API Error"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Google API Error"
        });
    });

    it("Find existing user error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        userDomain.readUserBySocialProfile = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read User Error"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read User Error"
        });
    });

    it("ProviderUserId already registered, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        userDomain.readUserBySocialProfile = jest.fn().mockResolvedValue(new User());

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "providerUserId already registered"
        });
    });

    it("Person already registered, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        userDomain.readUserBySocialProfile = jest.fn().mockResolvedValue(null);

        userDomain.readUserByPersonId = jest.fn().mockResolvedValue(new User());

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Person already registered"
        });
    });

    it("Save user error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        userDomain.readUserBySocialProfile = jest.fn().mockResolvedValue(null);

        userDomain.readUserByPersonId = jest.fn().mockResolvedValue(null);
        
        userDomain.createUser = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save New User Error"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save New User Error"
        });
    });

    it("publish event error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        personDomain.readPerson = jest.fn().mockResolvedValue(new Person());

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        userDomain.readUserBySocialProfile = jest.fn().mockResolvedValue(null);

        userDomain.readUserByPersonId = jest.fn().mockResolvedValue(null);

        userDomain.createUser = jest.fn().mockResolvedValue(new User());

        utility.publishEvent = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "publish event error"
        });
    });

    it("success",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "B",
            personId: "C"
        };

        registrationHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        userDomain.readUserBySocialProfile = jest.fn().mockResolvedValue(null);

        userDomain.readUserByPersonId = jest.fn().mockResolvedValue(null);

        userDomain.createUser = jest.fn().mockResolvedValue({
            _id: "A",
            personId: "C"
        });

        utility.publishEvent = jest.fn().mockResolvedValue({});

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).resolves.toEqual({
            _id: "A",
            personId: "C"
        });
    });
});