const guestService = require("../../src/booking/guest.service");
const gogowakeCommon = require("gogowake-common");
var mongoose = require('mongoose');
const Booking = require("../../src/booking/booking.model").Booking;

describe('Test guest.controller', () => {
    describe("testing removeGuest()", function () {

        input = {};
        user = {};

        it("no user authorization, should return 401", async () => {

            //fake gogowakeCommon.userAuthorization, returning false
            gogowakeCommon.userAuthorization = function () {
                return false;
            }

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(401);
                expect(e.message).toEqual("Insufficient Rights");
            }

        });

        it("missing booking id, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("bookingId is required");
            }

        });

        it("missing guest id, should return 400", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            input.bookingId = "123";

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(400);
                expect(e.message).toEqual("guestId is required");
            }

        });

        it("invalid bookingId, booking not found should return 404", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }
            input.guestId = "ID_GUEST1"

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(404);
                expect(e.message).toEqual("Booking not found, invalid bookingId");
            }

        });

        it("booking not found, should return 404", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Booking.findById, resolving null, simulating no booking found
            Booking.findById = function () {
                return Promise.resolve(null);
            }

            input.bookingId = mongoose.Types.ObjectId().toHexString();

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(404);
                expect(e.message).toEqual("Booking not found");
            }

        });

        it("simulate db booking.findById() error, should return 500", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Booking.findById, rejected, simulating db error
            Booking.findById = function () {
                return Promise.reject("db error");
            }

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(500);
                expect(e.message).toMatch(/Internal Service error. Reference ID :/);
            }

        });

        it("Simulate no guest found - booking object has no guest, should return 404", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Booking.findById, resolve a booking object without any guests, simulating db error
            Booking.findById = function () {
                return Promise.resolve({guests:[]});
            }

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(404);
                expect(e.message).toEqual("Guest not found");
            }

        });

        it("simulate no guest found - booking object has 1 guest, but not _id : ID_GUEST1, should return 404", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Booking.findById, resolve a booking object without one guest.
            Booking.findById = function () {
                return Promise.resolve({
                    guests: [
                        { _id: "ID_ABC", guestName: "GUEST ABC"}
                    ]
                });
            }

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(404);
                expect(e.message).toEqual("Guest not found");
            }

        });
        
        it("simulate db booking.save() error, should return 500", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Booking.findById, resolve a booking object without two guests.
            var booking = new Booking();
            booking.guests = [
                { guestName: "GUEST_1" },
                { guestName: "GUEST_2" }
            ]
            Booking.findById = function () {
                return Promise.resolve(booking);
            }

            //setup mock Booking.save(), reject, simulate db error
            booking.save = function () {
                return Promise.reject("db error");
            }

            input.guestId = booking.guests[0]._id.toHexString();

            try {
                await guestService.removeGuest(input, user);
            } catch (e) {
                expect(e.status).toEqual(500);
                expect(e.message).toMatch(/Internal Service error. Reference ID :/);
            }

        });
        
        it("successful remove guest, should return booking with only 1 guest", async () => {

            //setup mock gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = function () {
                return true;
            }

            //setup mock Booking.findById, resolve a booking object without two guests.
            var booking = new Booking();
            booking.guests = [
                { guestName: "GUEST_1" },
                { guestName: "GUEST_2" }
            ]
            Booking.findById = function () {
                return Promise.resolve(booking);
            }

            //setup mock Booking.save(), reject, simulate db error
            booking.save = function () {
                return Promise.resolve({});
            }

            input.guestId = booking.guests[0]._id.toHexString();

            await guestService.removeGuest(input, user)
                .then(result => {
                    expect(result.guests.length).toEqual(1);
                    expect(result.history[0].transactionDescription).toEqual("Removed guest : GUEST_1");
                });

        });
        
    });
});
