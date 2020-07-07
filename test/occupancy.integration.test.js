const chai = require("chai");
var chaiHttp = require("chai-http");
const server = require("../server");
const Occupancy = require("../src/occupancy/occupancy.model").Occupancy;
const common = require("gogowake-common");
const mongoose = require("mongoose");

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_API_LOGIN = "tester";
const AUTHENTICATION_API_PASSWORD = "password123";
var accessToken;

describe('Occupancy Endpoints', () => {

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

    describe("testing add new occupancy", function () {

        before(async () => {
            await deleteAll();
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing occupancyType, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({})
                .then(response => {
                    assert.equal(response.body.error, "occupancyType is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid occupationType, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({"occupancyType":"ABC"})
                .then(response => {
                    assert.equal(response.body.error, "Invalid occupancyType");
                    assert.equal(response.status, 400);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({ "occupancyType": "OPEN_BOOKING" })
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "1234"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-123T08:00:ab",
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime");
                    assert.equal(response.status, 400);
                });
        });

        it("missing endTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                })
                .then(response => {
                    assert.equal(response.body.error, "endTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid endTime, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2345"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime");
                    assert.equal(response.status, 400);
                });
        });

        it("endTime earlier then startTime by one day, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-28T08:00:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "endTime cannot be earlier then startTime");
                    assert.equal(response.status, 400);
                });
        });

        it("endTime earlier then startTime by one hour, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-29T07:00:00"
                })
                .then(response => {
                    assert.equal(response.body.error, "endTime cannot be earlier then startTime");
                    assert.equal(response.status, 400);
                });
        });

        it("occupancy less than 59 min and 59 seconds, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-29T08:59:58"
                })
                .then(response => {
                    assert.equal(response.body.error, "Cannot occupy asset for less then 59 mins 59 secs");
                    assert.equal(response.status, 400);
                });
        });

        it("missing assetId, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-29T08:59:59"
                })
                .then(response => {
                    assert.equal(response.body.error, "assetId is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid assetId, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-29T08:59:59",
                    "assetId": "ABC"
                })
                .then(response => {
                    assert.equal(response.body.error, "Invalid assetId");
                    assert.equal(response.status, 400);
                });
        });

        it("all input parameters correct, should return 200 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-29T08:59:59",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    newOccupancy = response.body;
                    assert.equal(response.status, 200);
                    assert(newOccupancy.id);
                    assert.equal(newOccupancy.startTime.substring(0, 4),"2020");
                    assert.equal(newOccupancy.startTime.substring(5, 7),"04");
                    assert.equal(newOccupancy.startTime.substring(8, 10),"29");
                    assert.equal(newOccupancy.startTime.substring(11, 13),"08");
                    assert.equal(newOccupancy.startTime.substring(14, 16),"00");
                    assert.equal(newOccupancy.startTime.substring(17, 19), "00");
                    assert.equal(newOccupancy.endTime.substring(0, 4), "2020");
                    assert.equal(newOccupancy.endTime.substring(5, 7), "04");
                    assert.equal(newOccupancy.endTime.substring(8, 10), "29");
                    assert.equal(newOccupancy.endTime.substring(11, 13), "08");
                    assert.equal(newOccupancy.endTime.substring(14, 16), "59");
                    assert.equal(newOccupancy.endTime.substring(17, 19), "59");
                    assert.equal(newOccupancy.history.length, 1);
                    assert.equal(newOccupancy.history[0].userName, "Tester Account");
                    assert.equal(newOccupancy.history[0].transactionDescription, "New Occupancy Record");
                });
        });

        it("try to book 07:30:00 to 08:30:00, timeslot not available, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:00:00",
                    "endTime": "2020-04-29T08:59:59",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    assert.equal(response.body.error, "Timeslot not available");
                    assert.equal(response.status, 400);
                });
        });

        it("try to book 08:30:00 to 09:30:00, timeslot not available, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T08:30:00",
                    "endTime": "2020-04-29T09:30:00",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    assert.equal(response.body.error, "Timeslot not available");
                    assert.equal(response.status, 400);
                });
        });

        it("try to book 06:00:00 to 09:00:00, timeslot not available, should return 400 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T06:00:00",
                    "endTime": "2020-04-29T09:00:00",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    assert.equal(response.body.error, "Timeslot not available");
                    assert.equal(response.status, 400);
                });
        });

        it("all input parameters correct, should return 200 status", async () => {
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-04-29T09:00:00",
                    "endTime": "2020-04-29T09:59:59",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    newOccupancy = response.body;
                    assert.equal(response.status, 200);
                    assert(newOccupancy.id);
                    assert.equal(newOccupancy.startTime.substring(0, 4), "2020");
                    assert.equal(newOccupancy.startTime.substring(5, 7), "04");
                    assert.equal(newOccupancy.startTime.substring(8, 10), "29");
                    assert.equal(newOccupancy.startTime.substring(11, 13), "09");
                    assert.equal(newOccupancy.startTime.substring(14, 16), "00");
                    assert.equal(newOccupancy.startTime.substring(17, 19), "00");
                    assert.equal(newOccupancy.endTime.substring(0, 4), "2020");
                    assert.equal(newOccupancy.endTime.substring(5, 7), "04");
                    assert.equal(newOccupancy.endTime.substring(8, 10), "29");
                    assert.equal(newOccupancy.endTime.substring(11, 13), "09");
                    assert.equal(newOccupancy.endTime.substring(14, 16), "59");
                    assert.equal(newOccupancy.endTime.substring(17, 19), "59");
                });
        });
    });
    
    describe("testing get occupancies", async function () {

        this.timeout(5000);

        before(async () => {
            await deleteAll();

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T05:00:00",
                    "endTime": "2020-05-03T05:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T06:00:00",
                    "endTime": "2020-05-03T06:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T07:00:00",
                    "endTime": "2020-05-03T07:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T08:00:00",
                    "endTime": "2020-05-03T08:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T09:00:00",
                    "endTime": "2020-05-03T09:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T10:00:00",
                    "endTime": "2020-05-03T10:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-03T11:00:00",
                    "endTime": "2020-05-03T11:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-04T11:00:00",
                    "endTime": "2020-05-04T11:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-04T17:00:00",
                    "endTime": "2020-05-04T17:59:59",
                    "assetId": "MC_NXT20"
                });

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-04T18:00:00",
                    "endTime": "2020-05-04T18:59:59",
                    "assetId": "MC_NXT20"
                });
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .get("/occupancies")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("missing endTime, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-03T00:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "endTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid endTime, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-03T00:00:00&endTime=1234")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("endTime earlier then startTime, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-03T00:00:00&endTime=2020-05-02T23:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime");
                    assert.equal(response.status, 400);
                });
        });

        it("missing assetId, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-03T00:00:00&endTime=2020-05-03T23:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "assetId is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid assetId, expect 400 response", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-03T00:00:00&endTime=2020-05-03T23:59:59&assetId=ABC")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid assetId");
                    assert.equal(response.status, 400);
                });
        });

        it("search 2020-05-03T00:00:00 to 2020-05-03T23:59:59, expect 3 return", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-03T00:00:00&endTime=2020-05-03T23:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    const occupancies = response.body.occupancies;
                    assert.equal(occupancies.length, 7);
                    assert(occupancies[0].id)
                    assert.equal(occupancies[0].startTime, "2020-05-03T05:00:00");
                    assert.equal(occupancies[0].endTime, "2020-05-03T05:59:59");
                    assert.equal(occupancies[0].occupancyType, "OPEN_BOOKING");
                    assert.equal(occupancies[0].assetId, "MC_NXT20");
                    assert(occupancies[1].id)
                    assert.equal(occupancies[1].startTime, "2020-05-03T06:00:00");
                    assert.equal(occupancies[1].endTime, "2020-05-03T06:59:59");
                    assert.equal(occupancies[1].occupancyType, "OPEN_BOOKING");
                    assert.equal(occupancies[1].assetId, "MC_NXT20");
                });
        });

        it("search 2020-05-04T00:00:00 to 2020-05-04T23:59:59, expect 3 return", async () => {
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-04T00:00:00&endTime=2020-05-04T23:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.occupancies.length, 3);
                });
        });
    });
    
    describe("test availability", async function () {
        before(async () => {
            await deleteAll();

            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-05T09:00:00",
                    "endTime": "2020-05-05T09:59:59",
                    "assetId": "MC_NXT20"
                });
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .get("/availability")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, expect 400 status", async () => {
            await chai.request(server)
                .get("/availability")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "startTime is mandatory");
                });
        });

        it("invalid startTime format, expect 400 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid startTime format");
                });
        });

        it("missing endTime, expect 400 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T08:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "endTime is mandatory");
                });
        });

        it("invalid endTime format, expect 400 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T08:00:00&endTime=2020")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid endTime format");
                });
        });

        it("endTime earlier then startTime, expect 400 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T08:00:00&endTime=2020-05-05T07:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid endTime");
                });
        });

        it("missing assetId, expect 400 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T08:00:00&endTime=2020-05-05T08:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "assetId is mandatory");
                });
        });

        it("success, from 08:00:00 to 08:59:59, expect isAvailable : true, expect 200 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T08:00:00&endTime=2020-05-05T08:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.isAvailable, true);
                });
        });

        it("success, from 09:00:00 to 09:59:59, expect isAvailable : false, expect 200 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T09:00:00&endTime=2020-05-05T09:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.isAvailable, false);
                });
        });

        it("success, from 08:00:00 to 09:59:59, expect isAvailable : false, expect 200 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T08:00:00&endTime=2020-05-05T09:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.isAvailable, false);
                });
        });

        it("success, from 10:00:00 to 10:59:59, expect isAvailable : false, expect 200 status", async () => {
            await chai.request(server)
                .get("/availability?startTime=2020-05-05T10:00:00&endTime=2020-05-05T10:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.isAvailable, true);
                });
        });
    });
    
    describe("test release occupancy", function () {

        var occupancy1;
        var occupancy2;
        var occupancy3;

        before(async () => {
            await deleteAll();

            //add occupancy #1
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-05T09:00:00",
                    "endTime": "2020-05-05T09:59:59",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    occupancy1 = response.body;
                });

            //add occupancy #2
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-05T10:00:00",
                    "endTime": "2020-05-05T10:59:59",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    occupancy2 = response.body;
                });

            //add occupancy #3
            await chai.request(server)
                .post("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "occupancyType": "OPEN_BOOKING",
                    "startTime": "2020-05-05T11:00:00",
                    "endTime": "2020-05-05T11:59:59",
                    "assetId": "MC_NXT20"
                })
                .then(response => {
                    occupancy3 = response.body;
                });

            //confirm 3 occupancies added
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-05T00:00:00&endTime=2020-05-05T23:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.occupancies.length,3);
                });
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .delete("/occupancy")
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing occupancyId, should return 400 status", async () => {
            await chai.request(server)
                .delete("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "occupancyId is mandatory");
                });
        });

        it("invalid occupancyId, should return 400 status", async () => {
            await chai.request(server)
                .delete("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({ "occupancyId": "abc" })
                .then(response => {
                    assert.equal(response.status, 500);
                });
        });

        it("success release, should return 200 status", async () => {
            await chai.request(server)
                .delete("/occupancy")
                .set("Authorization", "Token " + accessToken)
                .send({"occupancyId":occupancy3.id})
                .then(response => {
                    assert.equal(response.status, 200);
                });

            //confirm only 2 occupancies left
            await chai.request(server)
                .get("/occupancies?startTime=2020-05-05T00:00:00&endTime=2020-05-05T23:59:59&assetId=MC_NXT20")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.occupancies.length, 2);
                });
        });
    });

});

async function deleteAll() {
    await Occupancy.deleteMany().exec();
}
