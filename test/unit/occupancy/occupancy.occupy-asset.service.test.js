const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;
const availibilityService = require("../../../src/occupancy/availibility.service");
const gogowakeCommon = require("gogowake-common");

describe('Test occupancy.service', () => {
    describe("testing occupyAsset()", function () {

        input = {};
        user = {};

        it("no user authorization, should return 401", async () => {

            //fake gogowakeCommon.userAuthorization, returning false
            gogowakeCommon.userAuthorization = function () {
                return false;
            }

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 401,
                message: "Insufficient Rights"
            });
        });

        it("missing occupancyType, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "occupancyType is required"
            });
        });

        it("invalid occupancyType, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.occupancyType = "ABC";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "occupancyType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING, MAINTAINANCE]"
            });
        });

        it("missing startTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.occupancyType = "CUSTOMER_BOOKING";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "startTime is required"
            });
        });

        it("invalid startTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "ABC";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "startTime must be in ISO 8601 date format"
            });
        });

        it("missing endTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-02T23:59:59Z";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "endTime is required"
            });
        });

        it("invalid endTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.endTime = "ABC";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "endTime must be in ISO 8601 date format"
            });
        });

        it("missing assetId, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.endTime = "2020-02-02T23:59:59";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "assetId is required"
            });
        });

        it("invalid assetId, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.assetId = "ABC";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "assetId must be one of [A001, MC_NXT20]"
            });
        });

        it("startTime grater then endTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.assetId = "MC_NXT20";
            input.startTime = "2020-02-02T23:59:59Z";
            input.endTime = "2020-02-02T22:00:00Z";

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "endTime cannot be earlier then startTime"
            });
        });
        
        it("availibilityService.checkAvailibility() internal error, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-02T22:00:00Z";
            input.endTime = "2020-02-02T22:59:59Z";
            
            //setup mock availibilityService.checkAvailibility(), reject with internal error
            availibilityService.checkAvailibility = await jest.fn().mockRejectedValue(new Error("checkAvailibility db error"));

            expect.assertions(1);

            await expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 500,
                message: "checkAvailibility db error"
            });
        });
        
        it("Timeslot not available, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup moc availibilityService.checkAvailibility(), resolve false
            availibilityService.checkAvailibility = await jest.fn().mockResolvedValue(false);

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 400,
                message: "Timeslot not available"
            });

        });
        
        it("occupancy.save() error saving to db, should return 500", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup moc availibilityService.checkAvailibility(), resolve false
            availibilityService.checkAvailibility = await jest.fn().mockResolvedValue(true);

            //setup mock occupancy.save, reject
            Occupancy.prototype.save = await jest.fn().mockRejectedValue(new Error("occupancy.save db error"));

            expect.assertions(1);

            return expect(occupancyService.occupyAsset(input, user)).rejects.toEqual({
                status: 500,
                message: "occupancy.save db error"
            });

        });
        
        it("success, should return 200", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup moc availibilityService.checkAvailibility(), resolve false
            availibilityService.checkAvailibility = await jest.fn().mockResolvedValue(true);

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
});
