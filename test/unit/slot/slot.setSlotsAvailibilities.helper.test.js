const moment = require("moment");

const generateSlots = require("../../../src/slot/generateSlots.helper");
const setSlotsAvailibilities = require("../../../src/slot/setSlotsAvailibilities.helper");

describe('Test setSlotsAvailibilities()', () => {
    it("", () => {

        var dayStartTime = moment()
            .utcOffset(0)
            .add(1, "days")
            .set({ hour: 5, minute: 0, second: 0, millisecond: 0 })
            .toDate();
        var dayEndTime = moment()
            .utcOffset(0)
            .add(1, "days")
            .set({ hour: 17, minute: 0, second: 0, millisecond: 0 })
            .toDate();

        const slots = generateSlots(dayStartTime, dayEndTime);

        const occupancies = [
            {
                startTime: moment()
                    .utcOffset(0)
                    .add(1, "days")
                    .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
                    .toDate(),
                endTime: moment()
                    .utcOffset(0)
                    .add(1, "days")
                    .set({ hour: 11, minute: 29, second: 59, millisecond: 0 })
                    .toDate()
            }
        ]

        const finalSlots = setSlotsAvailibilities(slots, occupancies);
        
        expect(finalSlots.length).toEqual(25);
        expect(finalSlots[9].available).toEqual(true);
        expect(finalSlots[10].available).toEqual(false);
        expect(finalSlots[11].available).toEqual(false);
        expect(finalSlots[12].available).toEqual(false);
        expect(finalSlots[13].available).toEqual(true);
    });
});