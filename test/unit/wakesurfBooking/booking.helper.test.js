const moment = require("moment");

const bookingHelper = require("../../../src/wakesurfBooking/booking.helper");

describe('Test booking.helper', () => {
    describe("testing checkMinimumDuration", () => {
        it("Only 30mins, less then minimum, expect throw error",() => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T08:30:00Z").toDate();

            expect.assertions(1);

            expect(() => { bookingHelper.checkMimumDuration(startTime, endTime) }).toThrow("Booking cannot be less then 119 mins 59 secs");
        });

        it("120 mins, passed minimum requirement", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T10:30:00Z").toDate();

            expect.assertions(1);
            expect(bookingHelper.checkMimumDuration(startTime, endTime)).toEqual(true);
        });
    });

    describe("testing checkMaxiumDuration", () => {
        it("12hrs, more than maximium, expect throw error", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T20:00:00Z").toDate();

            expect.assertions(1);

            expect(() => { bookingHelper.checkMaximumDuration(startTime, endTime) }).toThrow("Booking cannot be more then 479 mins 59 secs");
        });

        it("7hrs, passed maximum requirement", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T15:00:00Z").toDate();

            expect.assertions(1);
            expect(bookingHelper.checkMaximumDuration(startTime, endTime)).toEqual(true);
        });
    });

    describe("testing checkEarliestStartTime", () => {
        it("earlier then 8am, expect throw error", () => {
            const startTime = moment("2020-02-02T07:00:00").toDate();

            expect.assertions(1);

            expect(() => { bookingHelper.checkEarliestStartTime(startTime, 8) }).toThrow("Booking cannot be earlier then 08:00");
        })

        it("after 8am, pass", () => {
            const startTime = moment("2020-02-02T09:00:00").toDate();

            expect.assertions(1);

            expect(bookingHelper.checkEarliestStartTime(startTime, 8)).toEqual(true);
        })
    });

    describe("testing checkLatestEndTime", () => {
        it("later then 4:30pm, expect throw error", () => {
            const endTime = moment("2020-02-02T16:31:00").toDate();

            expect.assertions(1);

            expect(() => { bookingHelper.checkLatestEndTime(endTime, 8) }).toThrow("Booking cannot be later then 16:30");
        })

        it("earlier 4:30pm, pass", () => {
            const endTime = moment("2020-02-02T16:29:00").toDate();

            expect.assertions(1);

            expect(bookingHelper.checkLatestEndTime(endTime, 8)).toEqual(true);
        })
    });

    describe("testing checkFulfilledTime", () => {
        it("fulfilled 2.5 hrs, longer then 2 hours booking duration, expect throw error", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T10:00:00Z").toDate();

            expect.assertions(1);

            expect(() => { bookingHelper.checkFulfilledTime(startTime, endTime, 2.5) }).toThrow("fulfilledHours cannot be greater then total duration hours");
        })

        it("fulfilled 1.5, pass", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T10:00:00Z").toDate();

            expect.assertions(1);

            expect(bookingHelper.checkLatestEndTime(startTime, endTime, 1.5)).toEqual(true);
        })
    })
});