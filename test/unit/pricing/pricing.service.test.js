const gogowakeCommon = require("gogowake-common");

const pricingService = require("../../../src/pricing/pricing.service");

describe('Test pricig.service', () => {
    describe("testing calculateTotalAmount()", function () {

        input = {};
        user = {};

        it("no user authorization, should return 401", () => {

            //fake gogowakeCommon.userAuthorization, returning false
            gogowakeCommon.userAuthorization = function () {
                return false;
            }

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(401);
                expect(e.message).toEqual("Insufficient Rights");
            }
        });
        
        it("missing startTime, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("startTime is required");

            }
        });

        it("invlid startTime, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "ABC";

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("startTime must be in ISO 8601 date format");

            }
        });

        it("missing endTime, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-02T08:00:00Z";

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("endTime is required");

            }
        });

        it("invlid endTime, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.endTime = "ABC";

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("endTime must be in ISO 8601 date format");

            }
        });

        it("missing bookingType, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.endTime = "2020-02-02T08:00:00Z";

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("bookingType is required");

            }
        });

        it("invalid bookingType, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.bookingType = "ABC";

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("bookingType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING]");

            }
        });

        it("endTime earlier then startTime, should return 400", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.bookingType = "CUSTOMER_BOOKING";
            input.startTime = "2020-02-02T09:00:00Z";
            input.endTime = "2020-02-02T08:00:00Z";

            expect.assertions(2);

            try {
                pricingService.calculateTotalAmount(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("endTime cannot be earlier then startTime");

            }
        });

        it("success for CUSTOMER_BOOKING on Sunday, 1hr45min round to 2hrs, should return 200", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-02T09:00:00Z";
            input.endTime = "2020-02-02T10:45:00Z";

            expect.assertions(1);

            result = pricingService.calculateTotalAmount(input, user);
            expect(result).toEqual({totalAmount: 2400, totalHours: 2, currency: "HKD"});
        });

        it("success for CUSTOMER_BOOKING on Monday, 1hr29min round to 1.5hrs, should return 200", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.startTime = "2020-02-03T09:00:00Z";
            input.endTime = "2020-02-03T10:29:00Z";

            expect.assertions(1);

            result = pricingService.calculateTotalAmount(input, user);
            expect(result).toEqual({ totalAmount: 1500, totalHours: 1.5,currency: "HKD" });
        });

        it("success for OWNER_BOOKING on Monday, 1.5hrs, should return 200", () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.bookingType = "OWNER_BOOKING";
            input.startTime = "2020-02-03T09:00:00Z";
            input.endTime = "2020-02-03T11:30:00Z";

            expect.assertions(1);

            result = pricingService.calculateTotalAmount(input, user);
            expect(result).toEqual({ totalAmount: 750, totalHours: 2.5, currency: "HKD" });
        });
    });
});
