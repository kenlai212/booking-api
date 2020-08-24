const moment = require('moment');

const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;
const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");

describe('Test occupancy.occupyAsset()', () => {
    input = {};
    user = {};

    it("no user authorization, should return 401", async () => {

        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing occupancyType, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "occupancyType is required"
        });
    });

    it("invalid occupancyType, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.occupancyType = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "occupancyType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING, MAINTAINANCE]"
        });
    });

    it("missing startTime, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.occupancyType = "CUSTOMER_BOOKING";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "2020-02-02T23:59:59Z";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid endTime, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.endTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing assetId, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.endTime = "2020-02-02T23:59:59";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("invalid assetId, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.assetId = "ABC";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId must be one of [A001, MC_NXT20]"
        });
    });

    it("startTime grater then endTime, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.assetId = "MC_NXT20";
        input.startTime = "2020-02-02T23:59:59Z";
        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });

    it("Occupancy.find() internal error, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "2020-02-02T22:00:00Z";
        input.endTime = "2020-02-02T22:59:59Z";

        //setup mock Occupancy.find(), reject with internal error
        Occupancy.find = await jest.fn().mockRejectedValue(new Error("occupancy.find error"));

        expect.assertions(1);

        await expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });
    
    it("Timeslot not available, checkAvailability return false, should return 400", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        //setup mock Occupancy.find(), resolve one overlapping occupancy
        Occupancy.find = await jest.fn().mockResolvedValue([
            {
                startTime: moment("2020-02-02T22:30:00Z").toDate(),
                endTime: moment("2020-02-02T23:30:00Z").toDate()
            }
        ]);

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Timeslot not available"
        });

    });
    
    it("occupancy.save() error saving to db, should return 500", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        //setup mock Occupancy.find(), resolve zero occupancy
        Occupancy.find = await jest.fn().mockResolvedValue([]);

        //setup mock occupancy.save, reject
        Occupancy.prototype.save = await jest.fn().mockRejectedValue(new Error("occupancy.save db error"));

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });

    });

    it("success, should return 200", async () => {

        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        //setup mock Occupancy.find(), resolve zero occupancy
        Occupancy.find = await jest.fn().mockResolvedValue([]);

        //setup mock occupancy.save, reject
        var occupancy = {
            startTime: new Date(input.startTime),
            endTime: new Date(input.endTime)
        }
        Occupancy.prototype.save = await jest.fn().mockResolvedValue(occupancy);

        expect.assertions(1);

        return expect(occupancyService.occupyAsset(input, user)).resolves.toEqual({
            id: undefined,
            occupancyType: undefined,
            startTime: '2020-02-02T22:00:00',
            endTime: '2020-02-02T22:59:59',
            assetId: undefined
        });
    });

});
