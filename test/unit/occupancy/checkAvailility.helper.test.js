const moment = require('moment');

const checkAvailibility = require("../../../src/occupancy/checkAvailibility.helper");

describe('Test checkAvailibility.helper', () => {
    var startTime = moment("2020-02-02T11:00:00Z");
    var endTime = moment("2020-02-02T12:00:00Z");

    test("No occupancies overlapped, expect return true", () => {
        const occupancies = [];

        const isAvailable = checkAvailibility(startTime, endTime, occupancies);

        expect(isAvailable).toEqual(true);
    });

    test("One occupancy in between startTime and endTime, expect return false", () => {
        const occupancies = [
            {
                startTime: moment("2020-02-02T11:00:00Z"),
                endTime: moment("2020-02-02T11:05:00Z")
            }
        ];

        const isAvailable = checkAvailibility(startTime, endTime, occupancies);

        expect(isAvailable).toEqual(false);
    });

    test("One occupancy in between overlap the startTime, expect return false", () => {
        const occupancies = [
            {
                startTime: moment("2020-02-02T10:00:00Z"),
                endTime: moment("2020-02-02T11:05:00Z")
            }
        ];

        const isAvailable = checkAvailibility(startTime, endTime, occupancies);

        expect(isAvailable).toEqual(false);
    });

    test("One occupancy in between overlap endTime, expect return false", () => {
        const occupancies = [
            {
                startTime: moment("2020-02-02T11:30:00Z"),
                endTime: moment("2020-02-02T12:30:00Z")
            }
        ];

        const isAvailable = checkAvailibility(startTime, endTime, occupancies);

        expect(isAvailable).toEqual(false);
    });

    test("One occupancy outside of startTime and endTime, expect return true", () => {
        const occupancies = [
            {
                startTime: moment("2020-02-02T08:00:00Z"),
                endTime: moment("2020-02-02T09:00:00Z")
            }
        ];

        const isAvailable = checkAvailibility(startTime, endTime, occupancies);

        expect(isAvailable).toEqual(true);
    });
});
