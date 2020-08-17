const mongoose = require("mongoose");

const gogowakeCommon = require("gogowake-common");

const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;;

describe('Test occupancy.service', () => {
    describe("testing releaseOccupancy()", function () {

        input = {};
        user = {};

        it("no user authorization, should return 401", async () => {

            //fake gogowakeCommon.userAuthorization, returning false
            gogowakeCommon.userAuthorization = function () {
                return false;
            }

            expect.assertions(1);

            return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
                status: 401,
                message: "Insufficient Rights"
            });
        });

        it("missing occupancyId, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            expect.assertions(1);

            return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
                status: 400,
                message: "occupancyId is required"
            });
        });

        it("Invalid occupancyId, should return 404", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.occupancyId = "INVALID_ID";

            expect.assertions(1);

            return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
                status: 404,
                message: "Invalid occupancyId"
            });

        });

        it("Occupancy.findByIdAndDelete() error saving to db, should return 500", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.occupancyId = mongoose.Types.ObjectId().toHexString();

            //setup mock Occupancy.findByIdAndDelete(), reject
            Occupancy.findByIdAndDelete = await jest.fn().mockRejectedValue(new Error("findByIdAndDelete db error"));

            expect.assertions(1);

            return expect(occupancyService.releaseOccupancy(input, user)).rejects.toEqual({
                status: 500,
                message: "Delete function not available"
            });

        });
        
        it("success, should return 200", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Occupancy.findByIdAndDelete(), reject
            Occupancy.findByIdAndDelete = await jest.fn().mockResolvedValue();

            expect.assertions(1);

            return expect(occupancyService.releaseOccupancy(input, user)).resolves.toEqual({ "result": "SUCCESS" });
        });
    });
});
