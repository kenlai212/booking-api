const moment = require("moment");

const generateSlots = require("../../../src/slot/generateSlots.helper");

describe('Test slot.generateSlots.helper', () => {
    it("startTime 08:00 - endTime 17:00, return 18 slots", () => {

        const dayStartTime = moment("2020-02-02T08:00:00Z").toDate();
        const dayEndTime = moment("2020-02-02T17:00:00Z").toDate();

        const slots = generateSlots(dayStartTime, dayEndTime);
        expect(slots.length).toEqual(19);
        expect(slots[0].startTime).toEqual(moment("2020-02-02T08:00:00Z").toDate());
        expect(slots[18].startTime).toEqual(moment("2020-02-02T17:00:00Z").toDate());
    });
});
