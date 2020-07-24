const chai = require("chai");
var chaiHttp = require("chai-http");
const server = require("../server");
const common = require("gogowake-common");
const Booking = require("../src/booking/booking.model").Booking;
const Occuapncy = require("../src/occupancy/occupancy.model").Occupancy;
const mongoose = require("mongoose");
const seedCrews = require("../seed/seedCrews");

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_API_LOGIN = "tester";
const AUTHENTICATION_API_PASSWORD = "password123";
var accessToken;

describe('Booking Endpoints', () => {

    //call login api to get accessToken
    before(async () => {
        await mongoose.connect(process.env.DB_CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true });

        if (accessToken == null) {
            await common.callLoginAPI(AUTHENTICATION_API_LOGIN, AUTHENTICATION_API_PASSWORD)
                .then(accessTokenObj => {
                    accessToken = accessTokenObj.accessToken;
                });
        }
    });

    after(async () => {
        await deleteAll();
    });
    
    describe("testing newBooking", function () {

        before(async() => {
            await deleteAll();
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
        var startTimeStr = common.dateToStandardString(startTime);

        var endTime = new Date();
        endTime.setDate(endTime.getDate() + 1);
        endTime.setUTCHours(9);
        endTime.setUTCMinutes(59);
        endTime.setUTCSeconds(59);
        var endTimeStr = common.dateToStandardString(endTime);

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
                    assert.equal(booking.bookingType, "CUSTOMER_BOOKING");
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
                    assert.equal(booking.history[0].userName, "Tester Account");
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
                    assert.equal(response.body.error, "Timeslot not available");
                });
        });

        it("test for owner booking, set time from 3 - 4 am should return 200 status", async () => {
            startTime.setHours(startTime.getHours() - 5);
            startTimeStr = common.dateToStandardString(startTime);
            endTime.setHours(endTime.getHours() - 6);
            endTimeStr = common.dateToStandardString(endTime);
            
            await chai.request(server)
                .post("/booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "bookingType": "OWNER_BOOKING",
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
                    assert.equal(booking.bookingType, "OWNER_BOOKING");
                    assert(booking.occupancyId);
                    assert(booking.creationTime);
                    assert(booking.createdBy);
                    assert.equal(booking.status, "CONFIRMED");
                    assert.equal(booking.paymentStatus, "AWAITING_PAYMENT");
                    assert.equal(booking.startTime, startTimeStr);
                    assert.equal(booking.endTime, endTimeStr);
                    assert.equal(booking.totalAmount,300);
                    assert.equal(booking.currency, "HKD");
                    assert.equal(booking.contactName, "tester");
                    assert.equal(booking.telephoneCountryCode, "852");
                    assert.equal(booking.telephoneNumber, "12345678");
                    assert.equal(booking.emailAddress, "test@test.com");
                    assert.equal(booking.history.length, 1);
                    assert.equal(booking.history[0].transactionDescription, "New booking");
                    assert.equal(booking.history[0].userName, "Tester Account");
                });
        });
    });
    
    describe("testing removeGuest", function () {
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
            await deleteAll()
                .then(async () => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
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
    
    describe("testing addCrew", async function () {
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

        await seedCrews.deleteAllCrews()
            .then(async () => {
                await seedCrews.seedCrews();
            });

        before(async () => {
            await deleteAll()
                .then(async () => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => {
                            booking1 = response.body;
                        });

                    //get crews
                    await chai.request(server)
                        .get("/crews")
                        .set("Authorization", "Token " + accessToken)
                        .then(response => {
                            assert.equal(response.status, 200);
                            crews = response.crews;
                        });

                    /*
                    const url = "http://api.occupancy.hebewake.com/crews";
                    const headers = {
                        "Authorization": "Token " + accessToken,
                        "content-Type": "application/json",
                    }

                    var response;
                    await fetch(url, { method: 'GET', headers: headers })
                        .then(async res => {
                            response = await res.json();
                        })
                        .catch(err => { console.log(err) });
                    
                    crews = response.crews;
                    */
                });
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
                    assert.equal(response.body.crews[0].telephoneCountryCode, crews[0].telephoneCountryCode);
                    assert.equal(response.body.crews[0].telephoneNumber, crews[0].telephoneNumber);
                });
        });

        it("add one more crew, should return 200 status", async () => {
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
                    assert.equal(response.body.crews[0].telephoneCountryCode, crews[0].telephoneCountryCode);
                    assert.equal(response.body.crews[0].telephoneNumber, crews[0].telephoneNumber);
                    assert.equal(response.body.crews[1].crewName, crews[1].crewName);
                    assert.equal(response.body.crews[1].telephoneCountryCode, crews[1].telephoneCountryCode);
                    assert.equal(response.body.crews[1].telephoneNumber, crews[1].telephoneNumber);
                });
        });
    });

    describe("testing editGuest", function () {
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
            await deleteAll()
                .then(async () => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
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
        });

        var guest1;
        var guest2;
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
                    guest1 = booking1.guests[0];
                    assert.equal(booking1.guests[1].guestName, "guest2");
                    guest2 = booking1.guests[1];
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
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
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "guestId is mandatory");
                });
        });

        it("missing guestName, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "123"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "guestName is mandatory");
                });
        });

        it("missing telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "123",
                    guestName: "tester2"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "telephoneCountryCode is mandatory");
                });
        });

        it("invalid telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "123",
                    guestName: "tester2",
                    telephoneCountryCode : "234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid telephoneCountryCode");
                });
        });

        it("missing telephoneNumber, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "123",
                    guestName: "tester2",
                    telephoneCountryCode: "852"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "telephoneNumber is mandatory");
                });
        });

        it("invalid guestId, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "123",
                    guestName: "tester2",
                    telephoneCountryCode: "852",
                    telephoneNumber: "123456"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid guestId");
                });
        });

        it("success edit guest1, should return 200 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: guest1._id,
                    guestName: "tester2",
                    telephoneCountryCode: "853",
                    telephoneNumber: "901234",
                    emailAddress: "tester2@test.com"
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
                    booking1 = response.body;
                    assert.equal(booking1.history.length, 3);
                    assert.equal(booking1.history[1].transactionDescription, "Added new guest : guest2");
                    assert.equal(booking1.history[2].transactionDescription, "Edited guest : tester2");
                    assert.equal(booking1.guests.length, 2);
                    assert.equal(booking1.guests[0].guestName, "tester2");
                    assert.equal(booking1.guests[0].telephoneCountryCode, "853");
                    assert.equal(booking1.guests[0].telephoneNumber, "901234");
                    assert.equal(booking1.guests[0].emailAddress, "tester2@test.com");
                    guest1 = booking1.guests[0];
                    assert.equal(booking1.guests[1].guestName, "guest2");
                    assert.equal(booking1.guests[1].telephoneCountryCode, "852");
                    assert.equal(booking1.guests[1].telephoneNumber, "12345678");
                    assert.equal(booking1.guests[1].emailAddress, "guest2@test.com");
                    guest2 = booking1.guests[1];
                });
        });

        it("success edit guest 2, should return 200 status", async () => {
            await chai.request(server)
                .put("/edit-guest")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: guest2._id,
                    guestName: "guest2",
                    telephoneCountryCode: "853",
                    telephoneNumber: "00000000",
                    emailAddress: "guest0000@test.com"
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
                    booking1 = response.body;
                    assert.equal(booking1.history.length, 4);
                    assert.equal(booking1.history[1].transactionDescription, "Added new guest : guest2");
                    assert.equal(booking1.history[2].transactionDescription, "Edited guest : tester2");
                    assert.equal(booking1.history[3].transactionDescription, "Edited guest : guest2");
                    assert.equal(booking1.guests.length, 2);
                    assert.equal(booking1.guests[0].guestName, "tester2");
                    assert.equal(booking1.guests[0].telephoneCountryCode, "853");
                    assert.equal(booking1.guests[0].telephoneNumber, "901234");
                    assert.equal(booking1.guests[0].emailAddress, "tester2@test.com");
                    guest1 = booking1.guests[0];
                    assert.equal(booking1.guests[1].guestName, "guest2");
                    assert.equal(booking1.guests[1].telephoneCountryCode, "853");
                    assert.equal(booking1.guests[1].telephoneNumber, "00000000");
                    assert.equal(booking1.guests[1].emailAddress, "guest0000@test.com");
                    guest2 = booking1.guests[1];
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
            await deleteAll()
                .then(async() => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => {
                            booking1 = response.body;
                        });
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

    describe("test editContact", function () {
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
            await deleteAll()
                .then(async () => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => {
                            booking1 = response.body;
                        });
                });
        });

        it("find booking 1, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.contactName, "tester");
                    assert.equal(response.body.telephoneCountryCode, "852");
                    assert.equal(response.body.telephoneNumber, "12345678");
                    assert.equal(response.body.emailAddress, "test@test.com");
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("missing contactName, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "contactName is mandatory");
                });
        });

        it("missing telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    contactName: "Ken"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "telephoneCountryCode is mandatory");
                });
        });

        it("invalid telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    contactName: "Ken",
                    telephoneCountryCode: "123"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid telephoneCountryCode");
                });
        });

        it("missing telephoneNumber, should return 400 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    contactName: "Ken",
                    telephoneCountryCode: "853"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "telephoneNumber is mandatory");
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .put("/edit-contact")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    contactName: "Ken",
                    telephoneCountryCode: "853",
                    telephoneNumber: "34567",
                    emailAddress: "ken.test@test.com"
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "SUCCESS");
                });
        });

        it("find booking 1, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.contactName, "Ken");
                    assert.equal(response.body.telephoneCountryCode, "853");
                    assert.equal(response.body.telephoneNumber, "34567");
                    assert.equal(response.body.emailAddress, "ken.test@test.com");
                });
        });
    });

    describe("testing make payment", function () {
        this.timeout(5000);
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
            await deleteAll()
                .then(async () => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
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
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => {
                            booking2 = response.body;
                        });
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/make-payment")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing paidAmount, should return 400 status", async () => {
            await chai.request(server)
                .put("/make-payment")
                .set("Authorization", "Token " + accessToken)
                .send()
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "paidAmount is mandatory");
                });
        });

        /*
        it("invalid paidAmount, should return 400 status", async () => {
            await chai.request(server)
                .put("/make-payment")
                .set("Authorization", "Token " + accessToken)
                .send({
                    paidAmount:"abc"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid paidAmount");
                });
        });*/

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/make-payment")
                .set("Authorization", "Token " + accessToken)
                .send({
                    paidAmount: 200
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/make-payment")
                .set("Authorization", "Token " + accessToken)
                .send({
                    paidAmount: 200,
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("success make payment, should return 200 status", async () => {
            await chai.request(server)
                .put("/make-payment")
                .set("Authorization", "Token " + accessToken)
                .send({
                    paidAmount: 200,
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
                    assert.equal(response.body.history[1].transactionDescription, "Payment status made changed to PAID");
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
            await deleteAll()
                .then(async() => {
                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
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
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
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
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        });
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
        this.timeout(5000);
        var booking4;

        before(async () => {
            await deleteAll()
                .then(async () => {
                    var startTime = common.getNowUTCTimeStamp();
                    startTime.setUTCDate(startTime.getUTCDate() + 1);
                    startTime.setUTCHours(8);
                    startTime.setUTCMinutes(0);
                    startTime.setUTCSeconds(0);

                    var endTime = common.getNowUTCTimeStamp();
                    endTime.setUTCDate(endTime.getUTCDate() + 1);
                    endTime.setUTCHours(9);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCSeconds(59);

                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        });

                    //add 2 hours, setup booking 2
                    startTime.setUTCHours(startTime.getUTCHours() + 2);
                    endTime.setUTCHours(endTime.getUTCHours() + 2);
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        });

                    //add 2 hours, setup booking3
                    startTime.setUTCHours(startTime.getUTCHours() + 2);
                    endTime.setUTCHours(endTime.getUTCHours() + 2);
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        });

                    //add 1 day, setup booking4
                    startTime.setUTCDate(startTime.getUTCDate() + 1);
                    endTime.setUTCDate(endTime.getUTCDate() + 1);
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => {
                            booking4 = response.body;
                        });
                });
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

        var tomorrowStart = common.getNowUTCTimeStamp();
        tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
        tomorrowStart.setUTCHours(0);
        tomorrowStart.setUTCMinutes(0);
        tomorrowStart.setUTCSeconds(0);

        var tomorrowEnd = common.getNowUTCTimeStamp();
        tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
        tomorrowEnd.setUTCHours(23);
        tomorrowEnd.setUTCMinutes(59);
        tomorrowEnd.setUTCSeconds(59);

        it("missing endTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + common.dateToStandardString(tomorrowStart))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "endTime is mandatory");
                });
        });

        it("invalid endTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + common.dateToStandardString(tomorrowStart) + "&endTime=abc")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid endTime format");
                });
        });

        it("found 3 for tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + common.dateToStandardString(tomorrowStart) + "&endTime=" + common.dateToStandardString(tomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.bookings.length, 3);
                });
        });

        var dayAfterTomorrowStart = common.getNowUTCTimeStamp();
        dayAfterTomorrowStart.setUTCDate(dayAfterTomorrowStart.getUTCDate() + 2);
        dayAfterTomorrowStart.setUTCHours(0);
        dayAfterTomorrowStart.setUTCMinutes(0);
        dayAfterTomorrowStart.setUTCSeconds(0);

        var dayAfterTomorrowEnd = common.getNowUTCTimeStamp();
        dayAfterTomorrowEnd.setUTCDate(dayAfterTomorrowEnd.getUTCDate() + 2);
        dayAfterTomorrowEnd.setUTCHours(23);
        dayAfterTomorrowEnd.setUTCMinutes(59);
        dayAfterTomorrowEnd.setUTCSeconds(59);

        it("found 1 for day after tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + common.dateToStandardString(dayAfterTomorrowStart) + "&endTime=" + common.dateToStandardString(dayAfterTomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.bookings.length, 1);
                    const booking = response.body.bookings[0];
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
        this.timeout(5000);
        var booking2;

        before(async () => {
            await deleteAll()
                .then(async () => {

                    var startTime = common.getNowUTCTimeStamp();
                    startTime.setDate(startTime.getDate() + 1);
                    startTime.setUTCHours(8);
                    startTime.setMinutes(0);
                    startTime.setSeconds(0);

                    var endTime = common.getNowUTCTimeStamp();
                    endTime.setDate(endTime.getDate() + 1);
                    endTime.setUTCHours(9);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCSeconds(59);

                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        });

                    //add 2 hours, setup booking 2
                    startTime.setUTCHours(startTime.getUTCHours() + 2);
                    endTime.setUTCHours(endTime.getUTCHours() + 2);
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => { booking2 = response.body });

                    //add 2 hours, setup booking3
                    startTime.setUTCHours(startTime.getUTCHours() + 2);
                    endTime.setUTCHours(endTime.getUTCHours() + 2);
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        });
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

        var tomorrowStart = common.getNowUTCTimeStamp();
        tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
        tomorrowStart.setUTCHours(0);
        tomorrowStart.setUTCMinutes(0);
        tomorrowStart.setUTCSeconds(0);

        var tomorrowEnd = common.getNowUTCTimeStamp();
        tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
        tomorrowEnd.setUTCHours(23);
        tomorrowEnd.setUTCMinutes(59);

        tomorrowEnd.setUTCSeconds(59);
        it("found 3 for tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/bookings?startTime=" + common.dateToStandardString(tomorrowStart) + "&endTime=" + common.dateToStandardString(tomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.bookings.length, 3);
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
                .get("/bookings?startTime=" + common.dateToStandardString(tomorrowStart) + "&endTime=" + common.dateToStandardString(tomorrowEnd))
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.bookings.length, 2);
                });
        });

        //TODO test for occupancy also got deleted also
    });

    describe("testing fullfill booking", function () {
        this.timeout(5000);
        var booking1;

        before(async () => {
            await deleteAll()
                .then(async () => {

                    var startTime = common.getNowUTCTimeStamp();
                    startTime.setDate(startTime.getDate() + 1);
                    startTime.setUTCHours(8);
                    startTime.setMinutes(0);
                    startTime.setSeconds(0);

                    var endTime = common.getNowUTCTimeStamp();
                    endTime.setDate(endTime.getDate() + 1);
                    endTime.setUTCHours(9);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCSeconds(59);

                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => { booking1 = response.body });
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .put("/fulfill-booking")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/fulfill-booking")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .put("/fulfill-booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: "1234"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid bookingId");
                });
        });

        it("missing fulfilledHours, should return 400 status", async () => {
            await chai.request(server)
                .put("/fulfill-booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "fulfilledHours is mandatory");
                });
        });

        it("fulfilledHours more then booking hours, should return 400 status", async () => {
            await chai.request(server)
                .put("/fulfill-booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    fulfilledHours: 7
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "fulfillHours cannot be greater then total duration hours");
                });
        });

        it("fulfilled 1 hour, should return 200 status", async () => {
            await chai.request(server)
                .put("/fulfill-booking")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    fulfilledHours: 1
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "FULFILLED");
                });
        });

        it("find booking1, should have FULFILLED status, and fulfilledHours = 1 should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.fulfilledHours, 1);
                    assert.equal(response.body.status, "FULFILLED");
                    assert.equal(response.body.history[1].transactionDescription, "Fulfilled booking");
                });
        });
    });

    describe("testing send disclaimer", function () {
        this.timeout(5000);
        var booking1;

        before(async () => {
            await deleteAll()
                .then(async () => {

                    var startTime = common.getNowUTCTimeStamp();
                    startTime.setDate(startTime.getDate() + 1);
                    startTime.setUTCHours(8);
                    startTime.setMinutes(0);
                    startTime.setSeconds(0);

                    var endTime = common.getNowUTCTimeStamp();
                    endTime.setDate(endTime.getDate() + 1);
                    endTime.setUTCHours(9);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCSeconds(59);

                    //setup booking1
                    await chai.request(server)
                        .post("/booking")
                        .set("Authorization", "Token " + accessToken)
                        .send({
                            "startTime": common.dateToStandardString(startTime),
                            "endTime": common.dateToStandardString(endTime),
                            "contactName": "tester",
                            "telephoneCountryCode": "852",
                            "telephoneNumber": "12345678",
                            "emailAddress": "test@test.com"
                        })
                        .then(response => { booking1 = response.body });
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .post("/send-disclaimer")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing bookingId, should return 400 status", async () => {
            await chai.request(server)
                .post("/send-disclaimer")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "bookingId is mandatory");
                });
        });

        it("invalid bookingId, should return 400 status", async () => {
            await chai.request(server)
                .post("/send-disclaimer")
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
                .post("/send-disclaimer")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "guestId is mandatory");
                });
        });

        it("missing guestId, should return 400 status", async () => {
            await chai.request(server)
                .post("/send-disclaimer")
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
                .post("/send-disclaimer")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: "ABC"
                })
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid guestId");
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .post("/send-disclaimer")
                .set("Authorization", "Token " + accessToken)
                .send({
                    bookingId: booking1.id,
                    guestId: booking1.guests[0]._id
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.status, "SUCCESS");
                });
        });

        it("find booking1, should return 200 status", async () => {
            await chai.request(server)
                .get("/booking?bookingId=" + booking1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    booking1 = response.body;
                    assert(booking1.guests[0].disclaimerId);
                });
        });
        
    });

});

async function deleteAll() {
    //delete all occupancies
    await Occuapncy.deleteMany().exec();

    //delete all bookings
    await Booking.deleteMany().exec();
}

/*
async function deleteAll() {
    var oneWeekAgo = common.getNowUTCTimeStamp();
    oneWeekAgo.setUTCDate(oneWeekAgo.getUTCDate() - 7);
    oneWeekAgo.setUTCHours(0);
    oneWeekAgo.setUTCMinutes(0);
    oneWeekAgo.setUTCSeconds(0);

    var oneWeekFromNow = common.getNowUTCTimeStamp();
    oneWeekFromNow.setUTCDate(oneWeekFromNow.getUTCDate() + 7);
    oneWeekFromNow.setUTCHours(23);
    oneWeekFromNow.setUTCMinutes(59);
    oneWeekFromNow.setUTCSeconds(59);

    //get all occupancies from yesterday till tomorrow
    const url = GET_OCCUPANCIES_URL + "?startTime=" + common.dateToStandardString(oneWeekAgo) + "&endTime=" + common.dateToStandardString(oneWeekFromNow) + "&assetId=MC_NXT20";
    const headers = {
        "Authorization": "Token " + accessToken,
        "content-Type": "application/json",
    }
    await fetch(url, { method: 'GET', headers: headers })
        .then(async res => {
            var result = await res.json();

            if (result.occupancies.length > 0) {

                //delete all occupancies from yesterday till tomorrow
                const url = DELETE_OCCUPANCY_URL;
                const headers = {
                    "Authorization": "Token " + accessToken,
                    "content-Type": "application/json",
                }

                result.occupancies.forEach(async occupancy => {
                    var data = {
                        "occupancyId": occupancy.id
                    }

                    await fetch(url, { method: 'DELETE', headers: headers, body: JSON.stringify(data) })
                        .then(async () => {
                            console.log("Successfully deleted occupancy : " + occupancy.id);
                        })
                        .catch(err => { console.log(err); });
                });
            }

            //delete all bookings
            await Booking.deleteMany().exec();
        })
        .catch(err => { console.log(err) });
}
*/