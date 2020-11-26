const moment = require('moment');
const mongoose = require("mongoose");

const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;
const customError = require("../../../src/common/customError");
const occupancyHelper = require("../../../src/occupancy/occupancy.helper");

describe('Test occupancy.occupyAsset()', () => {
    input = {};

    it("missing startTime, reject!", () => {
        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, reject!", () => {
        input.startTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, reject!", () => {
        input.startTime = "2020-02-02T23:59:59Z";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid endTime, reject!", () => {
        input.endTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing utcOffset, reject!", () => {
        input.endTime = "2020-02-02T23:59:59";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "utcOffset is required"
        });
    });

    it("missing assetId, reject!", () => {
        input.utcOffset = 8;

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("invalid assetId, reject!", () => {
        input.assetId = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId must be one of [A001, MC_NXT20]"
        });
    });

    it("Invalid bookingId, reject!", () => {
        input.assetId = "MC_NXT20";
        input.bookingId = "123";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid bookingId"
        });
    });

    it("Missing bookingType, reject!", () => {
        input.bookingId = mongoose.Types.ObjectId().toHexString();

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType is mandatory"
        });
    });

    it("startTime grater then endTime, reject!", () => {
        input.bookingType = "CUSTOMER_BOOKING";
        input.startTime = "2020-02-02T23:59:59Z";
        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });

    it("Occupancy.find() internal error, reject!", () => {
        input.startTime = "2020-02-02T22:00:00Z";
        input.endTime = "2020-02-02T22:59:59Z";

        //setup mock Occupancy.find(), reject with internal error
        Occupancy.find = jest.fn().mockRejectedValue(new Error("occupancy.find error"));

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });
    
    it("Timeslot not available, checkAvailability return false, reject!", () => {
        //setup mock Occupancy.find(), resolve zero occupancy
        Occupancy.find = jest.fn().mockResolvedValue([]);

        //setup mock occupancyHelper.checkAvailibility, return false;
        occupancyHelper.checkAvailability = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Timeslot not available"
        });

    });
    
    it("occupancy.save() error saving to db, reject!", () => {
        //setup mock Occupancy.find(), resolve zero occupancy
        Occupancy.find = jest.fn().mockResolvedValue([]);

        //setup mock occupancyHelper.checkAvailibility, return false;
        occupancyHelper.checkAvailability = jest.fn().mockReturnValue(true);

        //setup mock occupancy.save, reject
        Occupancy.prototype.save = jest.fn().mockRejectedValue(new Error("occupancy.save db error"));

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });

    });

    it("success!", () => {
        //setup mock Occupancy.find(), resolve zero occupancy
        Occupancy.find = jest.fn().mockResolvedValue([]);

        //setup mock occupancy.save, reject
        var occupancy = {
            startTime: new Date(input.startTime),
            endTime: new Date(input.endTime)
        }
        Occupancy.prototype.save = jest.fn().mockResolvedValue(occupancy);

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).resolves.toEqual({
            id: undefined,
            bookingType: undefined,
            bookingId: undefined,
            startTime: '2020-02-02T22:00:00.000Z',
            endTime: '2020-02-02T22:59:59.000Z',
            assetId: undefined
        });
    });

});
