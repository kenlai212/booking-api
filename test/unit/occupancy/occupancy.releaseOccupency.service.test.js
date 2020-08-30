const mongoose = require("mongoose");

const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");

const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;

describe('Test occupancy.releaseOccupancy()', () => {
    input = {};
    user = {};

    it("no user authorization, reject!", () => {

        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing occupancyId, reject!", () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "occupancyId is required"
        });
    });

    it("Invalid occupancyId, reject!", () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.occupancyId = "INVALID_ID";

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.RESOURCE_NOT_FOUND_ERROR,
            message: "Invalid occupancyId"
        });

    });

    it("Occupancy.findByIdAndDelete() error saving to db, reject!", () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.occupancyId = mongoose.Types.ObjectId().toHexString();

        //setup mock Occupancy.findByIdAndDelete(), reject
        Occupancy.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("findByIdAndDelete db error"));

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Delete function not available"
        });

    });

    it("success!", () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        //setup mock Occupancy.findByIdAndDelete(), resolve
        Occupancy.findByIdAndDelete = jest.fn().mockResolvedValue();

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).resolves.toEqual({ "result": "SUCCESS" });
    });
});
