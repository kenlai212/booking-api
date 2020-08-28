const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");
const crewService = require("../../../src/crew/crew.service");
const Crew = require("../../../src/crew/crew.model").Crew;

describe('Test occupancy.newCrew()', () => {
    input = {};
    user = {};

    it("no user authorization, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(crewService.newCrew(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing crewName, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(crewService.newCrew(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "crewName is required"
        });
    });

    it("missing telephoneCountryCode, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.crewName = "tester crew"

        expect.assertions(1);

        return expect(crewService.newCrew(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "telephoneCountryCode is required"
        });
    });

    it("missing telephoneNumber, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.crewName = "tester crew";
        input.telephoneCountryCode = "123"

        expect.assertions(1);

        return expect(crewService.newCrew(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "telephoneNumber is required"
        });
    });

    it("Mock Crew.save error, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.crewName = "tester crew";
        input.telephoneCountryCode = "123";
        input.telephoneNumber = "234"

        //mock Crew.save reject
        Crew.prototype.save = jest.fn().mockRejectedValue(new Error("mock crew.save error"));

        expect.assertions(1);

        return expect(crewService.newCrew(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });
});