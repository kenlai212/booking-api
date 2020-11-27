const mongoose = require("mongoose");

const customError = require("../../../src/common/customError");
const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;

describe('Test occupancy.releaseOccupancy()', () => {
    input = {};
    user = {};

    it("missing bookingId, reject!", () => {
        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingId is required"
        });
    });

    it("missing bookingType, reject!", () => {
        input.bookingId = mongoose.Types.ObjectId().toHexString();

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType is required"
        });

    });

    it("invalid bookingType, reject!", () => {
        input.bookingType = "INVALID_BOOKING_TYPE";

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING, MAINTAINANCE]"
        });

    });

    it("Invalid bookingId, reject!", () => {
        input.bookingId = "INVALID_ID";

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid bookingId"
        });

    });

    it("Occupancy.findOne() error, reject!", () => {
        input.bookingType = "CUSTOMER_BOOKING";

        //setup mock Occupancy.findOne, reject
        Occupancy.findOne = jest.fn().mockRejectedValue(new Error("findByIdAndDelete db error"));

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Occupancy.findOne not available"
        });

    });

    it("Occupancy.findOne() returns none found, reject!", () => {
        //setup mock Occupancy.findOne, resolve null
        Occupancy.findOne = jest.fn().mockResolvedValue(null);

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid bookingId & bookingType"
        });

    });

    it("Occupancy.findByIdAndDelete() error saving to db, reject!", () => {
        //setup mock Occupancy.findOne, resolve null
        Occupancy.findOne = jest.fn().mockResolvedValue({"":""});

        //setup mock Occupancy.findByIdAndDelete(), reject
        Occupancy.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("findByIdAndDelete db error"));

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Occupancy.findByIdAndDelete not available"
        });

    });

    it("success!", () => {
        //setup mock Occupancy.findByIdAndDelete(), resolve
        Occupancy.findByIdAndDelete = jest.fn().mockResolvedValue();

        expect.assertions(1);

        return expect(occupancyService.releaseOccupancy(input, user)).resolves.toEqual({ "result": "SUCCESS" });
    });
});
