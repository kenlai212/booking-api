const chai = require("chai");
var chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../server");
const helper = require("../src/helper");
const Booking = require("../src/booking.model").Booking;

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_DOMAIN = "http://api.authentication.hebewake.com";
const LOGIN_SUBDOMAIN = "/login";
const AUTHENTICATION_API_LOGIN = "ken";
const AUTHENTICATION_API_PASSWORD = "Maxsteel1596";
var accessToken;

describe('Booking Endpoints', () => {

    //call login api to get accessToken
    before(async () => {
        if (accessToken == null) {
            await callLoginAPI()
                .then(accessTokenObj => {
                    accessToken = accessTokenObj.accessToken;
                });
        }
    });

    describe("testing newBooking", function () {

        before(async () => {
            var tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setUTCHours(0);
            tomorrowStart.setUTCMinutes(0);
            tomorrowStart.setUTCSeconds(0);

            var tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setUTCHours(23);
            tomorrowEnd.setUTCMinutes(59);
            tomorrowEnd.setUTCSeconds(59);

            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20")
                .catch(err => {
                    console.log(err);
                });

            await deleteOccupancies(occupancies)
                .catch(err => {
                    console.log(err);
                });

            Booking.deleteMany().exec()
                .catch(err => {
                    console.log(err);
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .post("/booking")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime":"abc"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("missing endTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "endTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid endTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00",
                    "endTime": "2020-05-10T07:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime");
                    assert.equal(response.status, 400);
                });
        });

        it("less then 119 mins 59 sec, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00",
                    "endTime": "2020-05-10T08:30:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be less then 119 mins 59 secs");
                    assert.equal(response.status, 400);
                });
        });

        it("more then 479 mins 59 sec, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T08:00:00",
                    "endTime": "2020-05-10T20:30:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be more then 479 mins 59 secs");
                    assert.equal(response.status, 400);
                });
        });

        it("earlier then 5am, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T04:00:00",
                    "endTime": "2020-05-10T05:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be earlier then 05:00");
                    assert.equal(response.status, 400);
                });
        });

        it("later then 8pm, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T18:00:00",
                    "endTime": "2020-05-10T21:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be later then 20:00");
                    assert.equal(response.status, 400);
                });
        });

        it("booking in the past, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": "2020-05-10T15:00:00",
                    "endTime": "2020-05-10T19:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "Booking cannot be in the past");
                    assert.equal(response.status, 400);
                });
        });

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setUTCHours(8);
        startTime.setUTCMinutes(0);
        startTime.setUTCSeconds(0);
        var startTimeStr = helper.dateToStandardString(startTime);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);
        var endTimeStr = helper.dateToStandardString(endTime);

        it("missing contactName, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr
                })
                .then(response => {
                    assert.equal(response.body.error, "contactName is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("missing telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester"
                })
                .then(response => {
                    assert.equal(response.body.error, "telephoneCountryCode is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode":"123"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid telephoneCountryCode");
                    assert.equal(response.status, 400);
                });
        });

        it("missing telephoneNumber, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852"
                })
                .then(response => {
                    assert.equal(response.body.error, "telephoneNumber is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("success new booking, should return 200 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    const booking = response.body;
                    assert(booking.id);
                    assert.equal(booking.bookingType, "OPEN_BOOKING");
                    assert(booking.occupancyId);
                    assert(booking.creationTime);
                    assert(booking.createdBy);
                    assert.equal(booking.status, "AWAITING_CONFIRMATION");
                    assert.equal(booking.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(booking.startTime, startTimeStr);
                    assert.equal(booking.endTime, endTimeStr);
                    assert(booking.totalAmount);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                    assert.equal(booking.guests.length, 1);
                    assert.equal(booking.guests[0].guestName, "tester");
                    assert.equal(booking.guests[0].telephoneCountryCode, "852");
                    assert.equal(booking.guests[0].telephoneNumber, "12345678");
                    assert.equal(booking.guests[0].emailAddress, "test@test.com");
                    assert.equal(booking.history.length, 1);
                    assert.equal(booking.history[0].transactionDescription, "New booking");
                });
        });

        it("timeslot not available, should return 400 status", async () => {
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "timeslot not available");
                });
        });

        it("test for private booking, set time from 3 - 4 am should return 200 status", async () => {
            startTime.setHours(startTime.getHours() - 5);
            startTimeStr = helper.dateToStandardString(startTime);
            endTime.setHours(endTime.getHours() - 6);
            endTimeStr = helper.dateToStandardString(endTime);
            
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "bookingType": "PRIVATE_BOOKING",
                    "startTime": startTimeStr,
                    "endTime": endTimeStr,
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    const booking = response.body;
                    assert(booking.id);
                    assert.equal(booking.bookingType, "PRIVATE_BOOKING");
                    assert(booking.occupancyId);
                    assert(booking.creationTime);
                    assert(booking.createdBy);
                    assert.equal(booking.status, "AWAITING_CONFIRMATION");
                    assert.equal(booking.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(booking.startTime, startTimeStr);
                    assert.equal(booking.endTime, endTimeStr);
                    assert.equal(booking.totalAmount,0);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                });
        });
    });

    describe("tessting removeGuest", function () {
        var booking1;

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setUTCHours(8);
        startTime.setUTCMinutes(0);
        startTime.setUTCSeconds(0);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);

        before(async () => {
            var tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setUTCHours(0);
            tomorrowStart.setUTCMinutes(0);
            tomorrowStart.setUTCSeconds(0);

            var tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setUTCHours(23);
            tomorrowEnd.setUTCMinutes(59);
            tomorrowEnd.setUTCSeconds(59);

            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking1 = response.body;
                });

            //add guest to booking1
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "guestName": "guest2",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "guest2@test.com",
                    "bookingId": booking1.id
                });
        });

        it("find booking 1, expect 2 guests, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    booking1 = response.body;
                    assert.equal(booking1.history.length, 2);
                    assert.equal(booking1.history[1].transactionDescription, "Added new guest : guest2");
                    assert.equal(booking1.guests.length, 2);
                    assert.equal(booking1.guests[0].guestName, "tester");
                    assert.equal(booking1.guests[1].guestName, "guest2");
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/remove-guest")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/remove-guest")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/remove-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("missing guestId, should return 400 status", async () => {
            await chai.request(server)
                .put("/remove-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "guestId is mandatory");
                });
        });

        it("invalid guestId, should return 400 status", async () => {
            await chai.request(server)
                .put("/remove-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "123"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid guestId");
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .put("/remove-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: booking1.guests[1]._id
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "SUCCESS");
                });
        });

        it("find booking 1, expect 1 guests, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    booking1 = response.body;
                    assert.equal(booking1.history.length, 3);
                    assert.equal(booking1.history[1].transactionDescription, "Added new guest : guest2");
                    assert.equal(booking1.history[2].transactionDescription, "Removed guest : guest2");
                    assert.equal(booking1.guests.length, 1);
                    assert.equal(booking1.guests[0].guestName, "tester");
                });
        });
    });

    describe("tessting addCrew", function () {
        var booking1;
        var crews;

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setUTCHours(8);
        startTime.setUTCMinutes(0);
        startTime.setUTCSeconds(0);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);

        before(async () => {
            var tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setUTCHours(0);
            tomorrowStart.setUTCMinutes(0);
            tomorrowStart.setUTCSeconds(0);

            var tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setUTCHours(23);
            tomorrowEnd.setUTCMinutes(59);
            tomorrowEnd.setUTCSeconds(59);

            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking1 = response.body;
                });

            //get crews
            const url = "http://api.occupancy.hebewake.com/crews";
            const headers = {
                "Authorization": "Token " + accessToken,
                "content-Type": "application/json",
            }

            var response = new Object();
            await fetch(url, { method: 'GET', headers: headers })
                .then(async res => {
                    response = await res.json();
                })
                .catch(err => { console.log(err) });

            crews = response;
        });

        it("find booking 1, expect 0 crew, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    booking1 = response.body;
                    assert.equal(booking1.history.length, 1);
                    assert.equal(booking1.crews.length, 0);
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("missing crewId, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "crewId is mandatory");
                });
        });

        it("invalid crewId, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    crewId: "123"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid crewId");
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    crewId: crews[0].id
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "SUCCESS");
                });
        });

        it("find booking1, expect 1 crew member, should return 400 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.id, booking1.id);
                    assert.equal(response.body.crews.length, 1);
                    assert.equal(response.body.crews[0].crewName, crews[0].crewName);
                });
        });

        it("add on more crew, should return 200 status", async () => {
            await chai.request(server)
                .put("/add-crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    crewId: crews[1].id
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "SUCCESS");
                });
        });

        it("find booking1, expect 2 crew members, should return 400 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.id, booking1.id);
                    assert.equal(response.body.crews.length, 2);
                    assert.equal(response.body.crews[0].crewName, crews[0].crewName);
                    assert.equal(response.body.crews[1].crewName, crews[1].crewName);
                });
        });
    });

    describe("tessting addGuest", function () {
        var booking1;

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setUTCHours(8);
        startTime.setUTCMinutes(0);
        startTime.setUTCSeconds(0);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);

        before(async () => {
            var tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setUTCHours(0);
            tomorrowStart.setUTCMinutes(0);
            tomorrowStart.setUTCSeconds(0);

            var tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setUTCHours(23);
            tomorrowEnd.setUTCMinutes(59);
            tomorrowEnd.setUTCSeconds(59);

            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking1 = response.body;
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("missing guestName, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "guestName is mandatory");
                });
        });

        it("missing telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestName: "Ken"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "telephoneCountryCode is mandatory");
                });
        });

        it("invalid telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestName: "Ken",
                    telephoneCountryCode: "123"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid telephoneCountryCode");
                });
        });

        it("missing telephoneNumber, should return 400 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestName: "Ken",
                    telephoneCountryCode: "852"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "telephoneNumber is mandatory");
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .put("/add-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestName: "Ken",
                    telephoneCountryCode: "852",
                    telephoneNumber: "1234567"
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "SUCCESS");
                });
        });

        it("find booking 1, expect 2 guests, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.history.length, 2);
                    assert.equal(response.body.history[1].transactionDescription, "Added new guest : Ken");
                    assert.equal(response.body.guests.length, 2);
                    assert.equal(response.body.guests[0].guestName, "tester");
                    assert.equal(response.body.guests[1].guestName, "Ken");
                });
        });
    });

    describe("testing payment-status", function () {
        var booking1;
        var booking2;

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setUTCHours(8);
        startTime.setUTCMinutes(0);
        startTime.setUTCSeconds(0);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);

        before(async () => {
            var tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setUTCHours(0);
            tomorrowStart.setUTCMinutes(0);
            tomorrowStart.setUTCSeconds(0);

            var tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setUTCHours(23);
            tomorrowEnd.setUTCMinutes(59);
            tomorrowEnd.setUTCSeconds(59);

            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking1 = response.body;
                });

            //add 2 hours, setup booking 2
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking2 = response.body;
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing intent, should return 400 status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "intent is mandatory");
                });
        });

        it("invalid intent, should return 400 status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .set("Authorization", "Token " + accessToken)
                .send({
                    intent:"abc"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid intent");
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .set("Authorization", "Token " + accessToken)
                .send({
                    intent: "MARK_PAID"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .set("Authorization", "Token " + accessToken)
                .send({
                    intent: "MARK_PAID",
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("success MARK_PAID, should return 200 status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .set("Authorization", "Token " + accessToken)
                .send({
                    intent: "MARK_PAID",
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.paymentStatus, "PAID");
                });
        });

        it("find booking 1, expect paymentStatus is PAID, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.paymentStatus, "PAID");
                    assert.equal(response.body.history.length, 2);
                    assert.equal(response.body.history[1].transactionDescription, "paymentStatus changed to PAID");
                    assert(response.body.history[1].userId);
                });
        });

        it("find booking 2, expect paymentStatus is still AWAITING_PAYMENT, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking2.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.paymentStatus, "AWAITING_PAYMENT");
                });
        });

        it("success REVERSE_PAID for booking1, should return 200 status", async () => {
            await chai.request(server)
                .put("/payment-status")
                .set("Authorization", "Token " + accessToken)
                .send({
                    intent: "REVERSE_PAID",
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.paymentStatus, "AWAITING_PAYMENT");
                });
        });

        it("find booking 1, expect paymentStatus is AWAITING_PAYMENT, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(response.body.history.length, 3);
                    assert.equal(response.body.history[1].transactionDescription, "paymentStatus changed to PAID");
                    assert.equal(response.body.history[2].transactionDescription, "paymentStatus reversed to AWAITING_PAYMENT");
                    assert(response.body.history[1].userId);
                });
        });
    });

    describe("testing find Booking", function () {

        var booking1;
        var booking2;

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setUTCHours(8);
        startTime.setUTCMinutes(0);
        startTime.setUTCSeconds(0);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);

        before(async () => {
            var tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setUTCHours(0);
            tomorrowStart.setUTCMinutes(0);
            tomorrowStart.setUTCSeconds(0);

            var tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            tomorrowEnd.setUTCHours(23);
            tomorrowEnd.setUTCMinutes(59);
            tomorrowEnd.setUTCSeconds(59);
            
            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking1 = response.body;
                });

            //add 2 hours, setup booking 2
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => {
                    booking2 = response.body;
                });

            //add 2 hours, setup booking3
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/booking")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing id, should return 400 status", async () => {
            await chai.request(server)
                .get("/booking")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });
        
        it("found booking1, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    var booking = response.body;
                    assert.equal(booking.id, booking1.id);
                    assert.equal(booking.occupancyId, booking1.occupancyId);
                    assert(booking.creationTime, booking1.creationTime);
                    assert(booking.createdBy, booking1.createdBy);
                    assert.equal(booking.status, "AWAITING_CONFIRMATION");
                    assert.equal(booking.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(booking.startTime, booking1.startTime);
                    assert.equal(booking.endTime, booking1.endTime);
                    assert(booking.totalAmount);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                });
        });

        it("found booking2, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking2.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    var booking = response.body;
                    assert.equal(booking.id, booking2.id);
                    assert.equal(booking.occupancyId, booking2.occupancyId);
                    assert(booking.creationTime, booking2.creationTime);
                    assert(booking.createdBy, booking2.createdBy);
                    assert.equal(booking.status, "AWAITING_CONFIRMATION");
                    assert.equal(booking.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(booking.startTime, booking2.startTime);
                    assert.equal(booking.endTime, booking2.endTime);
                    assert(booking.totalAmount);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                });
        });
    });

    describe("testing search booking", function () {

        var tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setUTCHours(0);
        tomorrowStart.setUTCMinutes(0);
        tomorrowStart.setUTCSeconds(0);

        var tomorrowEnd = new Date();
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        tomorrowEnd.setUTCHours(23);
        tomorrowEnd.setUTCMinutes(59);
        tomorrowEnd.setUTCSeconds(59);

        var dayAfterTomorrowStart = new Date();
        dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 2);
        dayAfterTomorrowStart.setUTCHours(0);
        dayAfterTomorrowStart.setUTCMinutes(0);
        dayAfterTomorrowStart.setUTCSeconds(0);

        var dayAfterTomorrowEnd = new Date();
        dayAfterTomorrowEnd.setDate(dayAfterTomorrowEnd.getDate() + 2);
        dayAfterTomorrowEnd.setUTCHours(23);
        dayAfterTomorrowEnd.setUTCMinutes(59);
        dayAfterTomorrowEnd.setUTCSeconds(59);

        var booking4;

        before(async () => {
            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);
            //delet all occupancies of tomorrow
            occupancies = await getOccupancies(helper.dateToStandardString(dayAfterTomorrowStart), helper.dateToStandardString(dayAfterTomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            var startTime = new Date();
            startTime.setDate(startTime.getDate() + 1);
            startTime.setUTCHours(8);
            startTime.setMinutes(0);
            startTime.setSeconds(0);
            
            var endTime = new Date();
            endTime.setDate(endTime.getDate() + 1);
            endTime.setUTCHours(9);
            endTime.setUTCMinutes(59);
            endTime.setUTCSeconds(59);
            
            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                });

            //add 2 hours, setup booking 2
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                });

            //add 2 hours, setup booking3
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                });

            //add 1 day, setup booking4
            startTime.setDate(startTime.getDate() + 1);
            endTime.setDate(endTime.getDate() + 1);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => { booking4 = response.body });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/bookings")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/bookings")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "startTime is mandatory");
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=abc")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid startTime format");
                });
        });

        it("missing endTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + helper.dateToStandardString(tomorrowStart))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "endTime is mandatory");
                });
        });

        it("invalid endTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + helper.dateToStandardString(tomorrowStart) + "&endTime=abc")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid endTime format");
                });
        });

        it("found 3 for tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + helper.dateToStandardString(tomorrowStart) + "&endTime=" + helper.dateToStandardString(tomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 3);
                });
        });

        it("found 1 for day after tomorrow, should return 200 status", async () => {
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowEnd.setDate(tomorrowStart.getDate() + 1);
            await chai.request(server)
                .get("/bookings?startTime=" + helper.dateToStandardString(dayAfterTomorrowStart) + "&endTime=" + helper.dateToStandardString(dayAfterTomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 1);
                    const booking = response.body[0];
                    assert.equal(booking.id, booking4.id);
                    assert.equal(booking.occupancyId, booking4.occupancyId);
                    assert(booking.creationTime, booking4.creationTime);
                    assert(booking.createdBy, booking4.createdBy);
                    assert.equal(booking.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(booking.status, "AWAITING_CONFIRMATION");
                    assert.equal(booking.startTime, booking4.startTime);
                    assert.equal(booking.endTime, booking4.endTime);
                    assert(booking.totalAmount);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                });
        });
    });
    
    describe("testing cancel booking", function () {
        var tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setUTCHours(0);
        tomorrowStart.setUTCMinutes(0);
        tomorrowStart.setUTCSeconds(0);

        var tomorrowEnd = new Date();
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        tomorrowEnd.setUTCHours(23);
        tomorrowEnd.setUTCMinutes(59);
        tomorrowEnd.setUTCSeconds(59);

        var booking2;

        before(async () => {
            //delete all occupancies of today
            var occupancies = await getOccupancies(helper.dateToStandardString(tomorrowStart), helper.dateToStandardString(tomorrowEnd), "MC_NXT20");
            await deleteOccupancies(occupancies);

            //delete all bookings
            await Booking.deleteMany().exec();

            var startTime = new Date();
            startTime.setDate(startTime.getDate() + 1);
            startTime.setUTCHours(8);
            startTime.setMinutes(0);
            startTime.setSeconds(0);

            var endTime = new Date();
            endTime.setDate(endTime.getDate() + 1);
            endTime.setUTCHours(9);
            endTime.setUTCMinutes(59);
            endTime.setUTCSeconds(59);

            //setup booking1
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                });

            //add 2 hours, setup booking 2
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                })
                .then(response => { booking2 = response.body });

            //add 2 hours, setup booking3
            startTime.setHours(startTime.getHours() + 2);
            endTime.setHours(endTime.getHours() + 2);
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "startTime": helper.dateToStandardString(startTime),
                    "endTime": helper.dateToStandardString(endTime),
                    "contactName": "tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678",
                    "emailAddress": "test@test.com"
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .delete("/booking")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .delete("/booking")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("found 3 for tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + helper.dateToStandardString(tomorrowStart) + "&endTime=" + helper.dateToStandardString(tomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 3);
                });
        });

        it("success cancel booking, should return 200 status", async () => {
            await chai.request(server)
                .delete("/booking?bookingId=" + booking2.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                });
        });

        it("found 2 for tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + helper.dateToStandardString(tomorrowStart) + "&endTime=" + helper.dateToStandardString(tomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 2);
                });
        });

        //TODO test for occupancy also got deleted also
    });
    
});

async function deleteOccupancies(occupancies) {

    var deleteResults = [];

    if (occupancies.length > 0) {

        const url = "http://api.occupancy.hebewake.com/occupancy";
        const headers = {
            "Authorization": "Token " + accessToken,
            "content-Type": "application/json",
        }

        occupancies.forEach(async occupancy => {
            var data = {
                "occupancyId": occupancy.id
            }

            var deleteResult;
            await fetch(url, { method: 'DELETE', headers: headers, body: JSON.stringify(data) })
                .then(async res => {
                    deleteResult = await res.json();
                })
                .catch(err => { console.log(err); });

            deleteResults.push(deleteResult);
        });
    }

    return deleteResults;
}

async function getOccupancies(startTime, endTime, assetId) {
    const url = "http://api.occupancy.hebewake.com/occupancies?startTime=" + startTime + "&endTime=" + endTime + "&assetId=" + assetId;
    const headers = {
        "Authorization": "Token " + accessToken,
        "content-Type": "application/json",
    }

    var response = new Object();
    await fetch(url, { method: 'GET', headers: headers })
        .then(async res => {
            response = await res.json();
        })
        .catch(err => { console.log(err) });

    return response;
}

async function callLoginAPI() {
    const url = AUTHENTICATION_DOMAIN + LOGIN_SUBDOMAIN;
    const headers = {
        "content-Type": "application/json",
    }
    const data = {
        "loginId": AUTHENTICATION_API_LOGIN,
        "password": AUTHENTICATION_API_PASSWORD
    }
    
    var response;
    await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
        .then(async res => {
            if (res.status >= 200 && res.status < 300) {
                console.log("Sucessfully got accessToken!");
                response = await res.json();
            } else {
                console.log("External Authentication Login API error : " + res.statusText);
            }
        });

    return response;
}