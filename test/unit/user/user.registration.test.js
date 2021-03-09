const utility = require("../../../src/common/utility");
const {customError} = utility;

const {User} = require("../../../src/user/user.model");
const registration = require("../../../src/user/registration.service");
const socialProfileHelper = require("../../../src/user/socialProfile.helper");


describe("Test user.registration.service.invitedSocialRegister",() => {
    it("Missing provider",() => {
        const input = {};

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "provider is required"
        });
    });

    it("Invalid provider",() => {
        const input = {
            provider: "A"
        };

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "provider must be one of [FACEBOOK, GOOGLE]"
        });
    });

    it("Missing providerToken",() => {
        const input = {
            provider: "FACEBOOK"
        };

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "providerToken is required"
        });
    });

    it("Missing partyId",() => {
        const input = {
            provider: "FACEBOOK",
            providerToken: "A"
        };

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyId is required"
        });
    });

    it("socialProfileHelper.getSocialProfileFromFacebook error, reject",() => {
        const input = {
            provider: "FACEBOOK",
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromFacebook = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "Facebook Graph API Error"
            }
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Facebook Graph API Error"
        });
    });

    it("socialProfileHelper.getSocialProfileFromGoogle error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromGoogle = jest.fn().mockImplementation(() => {
            throw {
                name: customError.INTERNAL_SERVER_ERROR,
                message: "Google API Error"
            }
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
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        User.findOne = jest.fn().mockRejectedValue(new Error("findOne error"));

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Find User Error"
        });
    });

    it("User already registered, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        User.findOne = jest.fn().mockResolvedValue({
            _id: "A"
        });

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "providerUserId already exist"
        });
    });

    it("Save user error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        User.findOne = jest.fn().mockResolvedValue(null);

        User.prototype.save = jest.fn().mockRejectedValue(new Error("user.save error"));

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save New User Error"
        });
    });

    it("publish event error, reject",() => {
        const input = {
            provider: "GOOGLE",
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({});

        User.findOne = jest.fn().mockResolvedValue(null);

        User.prototype.save = jest.fn().mockResolvedValue({});

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
            providerToken: "A",
            partyId: "A"
        };

        socialProfileHelper.getSocialProfileFromGoogle = jest.fn().mockResolvedValue({
            name: "Tester",
            email: "tester@test.com"
        });

        User.findOne = jest.fn().mockResolvedValue(null);

        User.prototype.save = jest.fn().mockResolvedValue({
            _id: "A",
            partyId: "A"
        });

        utility.publishEvent = jest.fn().mockResolvedValue({});

        expect.assertions(1);

        return expect(registration.invitedSocialRegister(input)).resolves.toEqual({
            status: "SUCCESS",
		    message: `Published event to newUserRegistered queue`, 
		    newUserRegisteredEventMsg: {
                emailAddress: "tester@test.com",
                name: "Tester",
                partyId: "A",
                pictureUrl: undefined,
                userId: "A"
            }
        });
    });
});