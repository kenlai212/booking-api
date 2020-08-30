const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;
const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");

describe('Test occupancy.getOccupancies()', () => {
    input = {};
    user = {};

    it("no user authorization, should return 401", async () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing startTime, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "2020-02-02T23:59:59Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid startTime, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.endTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing assetId, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("invalid assetId, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.assetId = "ABC";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId must be one of [A001, MC_NXT20]"
        });
    });

    it("startTime grater then endTime, should return 400", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.assetId = "A001";
        input.startTime = "2020-02-02T23:59:59Z";
        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });

    it("occupancy.find() db error, should return 500", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        //setup mock occupancy.find, reject
        Occupancy.find = await jest.fn().mockRejectedValue(new Error());

        input.startTime = "2020-02-02T22:00:00Z";
        input.endTime = "2020-02-02T23:59:59Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });

    });

    it("success!!", async () => {
        //setup mock gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        //setup mock occupancy.save, reject
        var occupancies = [
            {
                startTime: new Date("2020-02-02T08:00:00Z"),
                endTime: new Date("2020-02-02T08:30:00Z")
            },
            {
                startTime: new Date("2020-02-02T09:00:00Z"),
                endTime: new Date("2020-02-02T09:30:00Z")
            }
        ]
        Occupancy.find = await jest.fn().mockResolvedValue(occupancies);

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input, user)).resolves.toEqual(
            {
                "occupancies": [
                    {
                        "assetId": undefined,
                        "endTime": "2020-02-02T08:30:00",
                        "id": undefined,
                        "occupancyType": undefined,
                        "startTime": "2020-02-02T08:00:00"
                    },
                    {
                        "assetId": undefined,
                        "endTime": "2020-02-02T09:30:00",
                        "id": undefined,
                        "occupancyType": undefined,
                        "startTime": "2020-02-02T09:00:00"
                    }]
            }
        );
    });
});
