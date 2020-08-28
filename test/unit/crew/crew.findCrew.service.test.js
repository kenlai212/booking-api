const mongoose = require("mongoose");

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

        return expect(crewService.findCrew(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing crewId, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(crewService.findCrew(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "crewId is required"
        });
    });

    it("invalid crewId, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.crewId = "ABC"

        expect.assertions(1);

        return expect(crewService.findCrew(input, user)).rejects.toEqual({
            name: customError.RESOURCE_NOT_FOUND_ERROR,
            message: "Invalid crewId"
        });
    });

    it("mock Crew.findById() fail, reject!", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.crewId = mongoose.Types.ObjectId().toHexString();

        //mock Crew.findById reject
        Crew.findById = jest.fn().mockRejectedValue("mock crew.findById");

        expect.assertions(1);

        return expect(crewService.findCrew(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });
});