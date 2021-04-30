const utility = require("../../../src/common/utility");
const {customError} = utility;

const occupancyService = require("../../../src/occupancy/occupancy.service");
const occupancyHelper = require("../../../src/occupancy/occupancy.helper");
const occupancyDomain = require("../../../src/occupancy/occupancy.domain");

describe('Test occupancy.occupyAsset()', () => {
    it("missing startTime, reject!", () => {
        input = {};

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, reject!", () => {
        input = {
            startTime : "ABC"
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z"
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid endTime, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "ABC"
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing utcOffset, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "2020-02-02T23:59:59"
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "utcOffset is required"
        });
    });

    it("missing assetId, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "2020-02-02T23:59:59",
            utcOffset : 8
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("Missing bookingType, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "2020-02-02T23:59:59",
            utcOffset : 8,
            assetId: "A"
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType is mandatory"
        });
    });

    it("Invalid assetId, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "2020-02-02T23:59:59",
            utcOffset : 8,
            assetId: "A",
            bookingType: "B"
        }

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid assetId"
        });
    });

    it("Invalid bookingType, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "2020-02-02T23:59:59",
            utcOffset : 8,
            assetId: "A",
            bookingType: "B"
        }

        occupancyHelper.validateAssetId = jest.fn().mockResolvedValue(new Object());

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid bookingTime"
        });
    });

    it("occupancyDomain.readOccupancies internal error, reject!", () => {
        input = {
            startTime : "2020-02-02T23:59:59Z",
            endTime : "2020-02-02T23:59:59",
            utcOffset : 8,
            assetId: "A",
            bookingType: "B"
        }

        occupancyHelper.validateAssetId = jest.fn().mockResolvedValue(true);

        occupancyHelper.validateBookingType = jest.fn().mockResolvedValue(true);

        //setup mock occupancyDomain.readOccupancy, reject with internal error
        occupancyDomain.readOccupancies = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read Occupancy Error"
        });

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read Occupancy Error"
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
