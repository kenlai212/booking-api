const occupancyService = require("../../src/occupancy/occupancy.service");
const availibilityService = require("../../src/occupancy/availibility.service");
const gogowakeCommon = require("gogowake-common");
const Occupancy = require("../../src/occupancy/occupancy.model").Occupancy;

describe('Test occupancy.service', () => {
    describe("testing occupyAsset()", function () {

        input = {};
        user = {};

        it("no user authorization, should return 401", async () => {

            //fake gogowakeCommon.userAuthorization, returning false
            gogowakeCommon.userAuthorization = function () {
                return false;
            }

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(401);
                expect(e.message).toEqual("Insufficient Rights");
            }
        });

        it("missing occupancyType, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("occupancyType is required");
            }
        });

        it("invalid occupancyType, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.occupancyType = "ABC";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("occupancyType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING, MAINTAINANCE]");
            }

        });

        it("missing startTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.occupancyType = "CUSTOMER_BOOKING";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("startTime is required");
            }

        });

        it("missing invalid startTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "ABC";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("startTime must be in ISO 8601 date format");
            }

        });

        it("missing endTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-02T23:59:59Z";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("endTime is required");
            }

        });

        it("missing invalid startTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.endTime = "ABC";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("endTime must be in ISO 8601 date format");
            }

        });

        it("missing assetId, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.endTime = "2020-02-02T23:59:59";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("assetId is required");
            }

        });

        it("invalid assetId, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.assetId = "ABC";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("assetId must be one of [A001, MC_NXT20]");
            }

        });

        it("startTime grater then endTime, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.assetId = "MC_NXT20";
            input.startTime = "2020-02-02T23:59:59Z";
            input.endTime = "2020-02-02T22:00:00Z";

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("endTime cannot be earlier then startTime");
            }

        });

        it("Occupancy.find() internal error, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-02T22:00:00Z";
            input.endTime = "2020-02-02T23:59:59Z";

            //setup moc Occupancy.find(), reject with internal error
            Occupancy.find = function () {
                return Promise.reject("db error");
            }

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(500);
                expect(e.message).toMatch(/Internal Service error. Reference ID :/);
            }

        });
        /*
        it("Timeslot not available, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Occupancy.find, return 1 overlaping occupancy
            Occupancy.find = function () {
                return Promise.resolve({
                    startTime: new Date("2020-02-02T22:00:00Z"),
                    endTime: new Date("2020-02-02T22:30:00Z")
                });
            }

            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("Timeslot not available");
            }

        });
        
        it("occupancy.save() error saving to db, should return500", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Occupancy.find, return true
            Occupancy.find = function () {
                return Promise.resolve();
            }
            
            //setup mock occupancy.save, reject
            var occupancy = new Occupancy();
            occupancy.save = function () {
                return Promise.reject();
            }
            
            try {
                await occupancyService.occupyAsset(input, user);
            } catch (e) {
                expect(e.status).toEqual(500);
                expect(e.message).toMatch(/Internal Service error. Reference ID :/);
            }
            
        });
        */
    });
});
