const moment = require("moment");

const bookingDurationHelper = require("../../../src/booking/bookingDuration.helper");

describe('Test bookingDuration.helper', () => {
    describe("testing checkMinimumDuration", function () {
        it("Only 30mins, less then minimum, expect throw error",() => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T08:30:00Z").toDate();

            expect.assertions(1);

            try{    
                bookingDurationHelper.checkMimumDuration(startTime, endTime);
            }catch(err){
                expect(err).toEqual("Booking cannot be less then 119 mins 59 secs");
            }
        });

        it("120 mins, passed minimum requirement", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T10:30:00Z").toDate();

            expect.assertions(1);
            expect(bookingDurationHelper.checkMimumDuration(startTime, endTime)).toEqual(true);
        });
    });

    describe("testing checkMaxiumDuration", function(){
        it("240mins, more than maximium, expect throw error", () => {
            const startTime = moment("2020-02-02T08:00:00Z").toDate();
            const endTime = moment("2020-02-02T20:00:00Z").toDate();

            expect.assertions(1);

            try{    
                bookingDurationHelper.checkMaximumDuration(startTime, endTime);
            }catch(err){
                expect(err).toEqual("Booking cannot be less then 119 mins 59 secs");
            }
        });
    })
});