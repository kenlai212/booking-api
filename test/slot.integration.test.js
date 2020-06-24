const chai = require("chai");
var chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../server");
const common = require("gogowake-common");
const Booking = require("../src/booking/booking.model").Booking;
const mongoose = require("mongoose");

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_API_LOGIN = "tester";
const AUTHENTICATION_API_PASSWORD = "password123";
var accessToken;

const GET_OCCUPANCIES_URL = "http://api.occupancy.hebewake.com/occupancies";
const DELETE_OCCUPANCY_URL = "http://api.occupancy.hebewake.com/occupancy";
const OCCUPY_ASSET_URL = "http://api.occupancy.hebewake.com/occupancy";

describe('Slot Endpoints', () => {

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
    })

    describe("testing getSlots", function () {
        this.timeout(5000);

        before(async() => {
            await deleteAll()
                .then(async() => {
                    //set start time to tomorrow
                    var startTime = common.getNowUTCTimeStamp();
                    startTime.setUTCDate(startTime.getUTCDate() + 1);

                    //occupy asset from 11:00:00 to 12:59:59
                    startTime.setUTCHours(11);
                    startTime.setUTCMinutes(0);
                    startTime.setUTCSeconds(0);

                    var endTime = common.getNowUTCTimeStamp();
                    endTime.setUTCDate(endTime.getUTCDate() + 1);
                    endTime.setUTCHours(12);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCSeconds(59);
                    await occupyAsset(common.dateToStandardString(startTime), common.dateToStandardString(endTime), "MC_NXT20");

                    //occupy asset from 15:00:00 to 16:59:59
                    startTime.setUTCHours(15);
                    startTime.setUTCMinutes(0);
                    startTime.setUTCSeconds(0);

                    endTime.setUTCHours(16);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCSeconds(59);
                    await occupyAsset(common.dateToStandardString(startTime), common.dateToStandardString(endTime), "MC_NXT20");
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/slots")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing targetDate, should return 400 status", async () => {
            await chai.request(server)
                .get("/slots")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "targetDate is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid targetDate format, should return 400 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid targetDate format");
                    assert.equal(response.status, 400);
                });
        });

        var now = common.getNowUTCTimeStamp();
        var nowStr = common.dateToStandardString(now);
        const todayStr = nowStr.slice(0, 10);
        const nowHourStr = nowStr.substr(11, 2);
        const minSlotIndex = nowHourStr - 5;
        
        it("success, test today, any slots before current time should have available = false, should return 200 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=" + todayStr)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    const slots = response.body;
                    assert.equal(slots.length, 15);
                    
                    slots.forEach(slot => {
                        if (slot.index <= minSlotIndex) {
                            assert.equal(slot.available, false);
                        }
                    });
                });
        });

        var tomorrow = common.getNowUTCTimeStamp();;
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        var tomorrowStr = common.dateToStandardString(tomorrow);
        tomorrowStr = tomorrowStr.slice(0, 10);

        it("success, test tomorrow, should return 200 status", async () => {
            await chai.request(server)
                .get("/slots?targetDate=" + tomorrowStr)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    const slots = response.body;
                    assert.equal(slots.length, 15);
                    assert.equal(slots[5].available, false);
                    assert.equal(slots[6].available, false);
                    assert.equal(slots[7].available, false);
                    assert.equal(slots[8].available, true);
                    assert.equal(slots[9].available, false);
                    assert.equal(slots[10].available, false);
                    assert.equal(slots[11].available, false);
                    assert.equal(slots[12].available, true);
                });
        });
    });
    
    describe("testing getEndSlots", function () {

        before(async() => {
            await deleteAll()
                .then(async () => {
                    //add one day
                    var startTime = common.getNowUTCTimeStamp();
                    startTime.setUTCDate(startTime.getUTCDate() + 1);
                    startTime.setUTCHours(11);
                    startTime.setUTCMinutes(0);
                    startTime.setUTCSeconds(0);

                    var endTime = common.getNowUTCTimeStamp();
                    endTime.setUTCDate(endTime.getUTCDate() + 1);
                    endTime.setUTCHours(12);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCMinutes(59);
                    await occupyAsset(common.dateToStandardString(startTime), common.dateToStandardString(endTime), "MC_NXT20");

                    startTime.setUTCHours(15);
                    startTime.setUTCMinutes(0);
                    startTime.setUTCSeconds(0);
                    
                    endTime.setUTCHours(16);
                    endTime.setUTCMinutes(59);
                    endTime.setUTCMinutes(59);
                    await occupyAsset(common.dateToStandardString(startTime), common.dateToStandardString(endTime), "MC_NXT20");
                });
        });

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/end-slots")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        var startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        var startTimeStr = common.dateToStandardString(startTime);
        const startTimeDateStr = startTimeStr.slice(0, 10);

        it("invalid startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T08:00:aa")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("successfully get end-slots starting form 05:00:00, should return 6 end-slots, weekday - unit cost should 1200 HKD, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T05:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 6);
                    assert.equal(response.body[0].startTime, startTimeDateStr + "T05:00:00");
                    assert.equal(response.body[1].startTime, startTimeDateStr + "T06:00:00");
                    assert.equal(response.body[2].startTime, startTimeDateStr + "T07:00:00");
                    assert.equal(response.body[3].startTime, startTimeDateStr + "T08:00:00");
                    assert.equal(response.body[4].startTime, startTimeDateStr + "T09:00:00");
                    assert.equal(response.body[5].startTime, startTimeDateStr + "T10:00:00");

                    //if startTime is on weekEnd vs weekDay, the totalAmount will be different
                    var day = startTime.getDay();
                    var isWeekend = (day === 6) || (day === 0);
                    if (isWeekend) {
                        assert.equal(response.body[0].totalAmount, 1200);
                        assert.equal(response.body[1].totalAmount, 2400);
                    } else {
                        assert.equal(response.body[0].totalAmount, 1000);
                        assert.equal(response.body[1].totalAmount, 2000);
                    }
                    
                    assert.equal(response.body[0].currency, "HKD");
                    assert.equal(response.body[1].currency, "HKD");
                });
        });

        it("successfully get end-slots starting form 08:00:00, should return 3 end-slots, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T08:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 3);
                });
        });

        it("successfully get end-slots starting form 11:00:00, should return 0 end-slots, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime=" + startTimeDateStr + "T11:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 0);
                });
        });

        it("successfully get end-slots starting form 10:00:00, should return 1 end-slots, should return 200 status", async () => {
            await chai.request(server)
                .get("/end-slots?startTime="+startTimeDateStr+"T10:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.length, 1);
                    assert.equal(response.body[0].startTime, startTimeDateStr + "T10:00:00");
                    //if startTime is on weekEnd vs weekDay, the totalAmount will be different
                    var day = startTime.getDay();
                    var isWeekend = (day === 6) || (day === 0);
                    if (isWeekend) {
                        assert.equal(response.body[0].totalAmount, 1200);
                    } else {
                        assert.equal(response.body[0].totalAmount, 1000);
                    }

                    assert.equal(response.body[0].currency, "HKD");
                });
        });
    });
});

async function occupyAsset(startTime, endTime, assetId) {
    const url = OCCUPY_ASSET_URL;
    const headers = {
        "Authorization": "Token " + accessToken,
        "content-Type": "application/json",
    }
    const data = {
        "startTime": startTime,
        "endTime": endTime,
        "assetId": assetId,
        "occupancyType": "OPEN_BOOKING"
    }

    var occupancy;
    await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(data) })
        .then(async res => {
            occupancy = await res.json();
        })
        .catch(err => { console.log(err); });

    console.log(occupancy);
    return occupancy;
}

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
            var occupancies = await res.json();

            if (occupancies.length > 0) {

                //delete all occupancies from yesterday till tomorrow
                const url = DELETE_OCCUPANCY_URL;
                const headers = {
                    "Authorization": "Token " + accessToken,
                    "content-Type": "application/json",
                }

                occupancies.forEach(async occupancy => {
                    var data = {
                        "occupancyId": occupancy.id
                    }

                    await fetch(url, { method: 'DELETE', headers: headers, body: JSON.stringify(data) })
                        .then(() => {
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