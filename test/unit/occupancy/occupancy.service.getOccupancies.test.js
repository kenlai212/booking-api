const occupancyService = require("../../../src/occupancy/occupancy.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;
const customError = require("../../../src/common/customError");

describe('Test occupancy.getOccupancies()', () => {
    input = {};
    it("missing startTime, reject!", () => {
        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, reject!", () => {
        input.startTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, reject!", () => {
        input.startTime = "2020-02-02T23:59:59Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid endTime, reject!", () => {
        input.endTime = "ABC";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing utcOffset, reject!", () => {
        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "utcOffset is required"
        });
    });

    it("missing assetId, reject!", () => {
        input.utcOffset = 8;

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("invalid assetId, reject!", () => {
        input.assetId = "ABC";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId must be one of [A001, MC_NXT20]"
        });
    });

    it("startTime grater then endTime, reject!", () => {

        input.assetId = "A001";
        input.startTime = "2020-02-02T23:59:59Z";
        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });

    it("occupancy.find() db error, reject!", () => {
        //setup mock occupancy.find, reject
        Occupancy.find = jest.fn().mockRejectedValue(new Error());

        input.startTime = "2020-02-02T22:00:00Z";
        input.endTime = "2020-02-02T23:59:59Z";

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });

    });

    it("success!!", () => {
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
        Occupancy.find = jest.fn().mockResolvedValue(occupancies);

        expect.assertions(1);

        return expect(occupancyService.getOccupancies(input)).resolves.toEqual(
            {
                "count":2,
                "occupancies": [
                    {
                        "bookingId": undefined,
                        "bookingType": undefined,
                        "assetId": undefined,
                        "endTime": "2020-02-02T08:30:00.000Z",
                        "id": undefined,
                        "occupancyType": undefined,
                        "startTime": "2020-02-02T08:00:00.000Z"
                    },
                    {
                        "bookingId": undefined,
                        "bookingType": undefined,
                        "assetId": undefined,
                        "endTime": "2020-02-02T09:30:00.000Z",
                        "id": undefined,
                        "occupancyType": undefined,
                        "startTime": "2020-02-02T09:00:00.000Z"
                    }]
            }
        );
    });
});
