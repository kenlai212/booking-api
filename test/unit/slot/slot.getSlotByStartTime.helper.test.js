const moment = require("moment");

const generateSlots = require("../../../src/slot/generateSlots.helper");
const getSlotByStartTimeHelper = require("../../../src/slot/getSlotByStartTime.helper");

describe('Test slot.getSlotByStartTime.helper', () => {
    describe("testing getSlotByStartTime()", function () {

        it("startTime 08:00 - endTime 17:00, return 18 slots", () => {

            const dayStartTime = moment("2020-02-02T08:00:00Z").toDate();
            const dayEndTime = moment("2020-02-02T17:00:00Z").toDate();

            const slots = generateSlots(dayStartTime, dayEndTime);

            const targetSlot = getSlotByStartTimeHelper.getSlotByStartTime(moment("2020-02-02T10:45:00Z").toDate(), slots);

            expect(targetSlot).toEqual({
                index: 5,
                startTime: moment("2020-02-02T10:30:00.000Z").toDate(),
                endTime: moment("2020-02-02T10:59:59.000Z").toDate()
            });
        });
    });
});