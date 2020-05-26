const chai = require("chai");
var chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const server = require("../server");

chai.use(chaiHttp);
const assert = chai.assert;

require('dotenv').config();

const AUTHENTICATION_DOMAIN = "http://api.authentication.hebewake.com";
const LOGIN_SUBDOMAIN = "/login";
const AUTHENTICATION_API_LOGIN = "ken";
const AUTHENTICATION_API_PASSWORD = "Maxsteel1596";
var accessToken;

describe('Pricing Endpoints', () => {

    //call login api to get accessToken
    before(async () => {
        if (accessToken == null) {
            await callLoginAPI()
                .then(accessTokenObj => {
                    accessToken = accessTokenObj.accessToken;
                });
        }
    });

    describe("testing getTotalAmount", function () {

        it("missing authentication token, should return 401 unauthorized status", async () => {
            await chai.request(server)
                .get("/total-amount")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/total-amount")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "startTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid startTime format, should return 400 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid startTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("missing endTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "endTime is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("invalid endTime fromat, should return 400 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00&endTime=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime format");
                    assert.equal(response.status, 400);
                });
        });

        it("endTime earlier than startTime, should return 400 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00&endTime=2020-05-10T07:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid endTime");
                    assert.equal(response.status, 400);
                });
        });
        
        it("weekend, less than 1 hour, but still counts as 1 hour, should return 200 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00&endTime=2020-05-10T08:00:01")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.totalAmount, 1200);
                    assert.equal(response.body.currency, "HKD");
                });
        });

        it("weekend, success getTotalAmount 1 hour, should return 200 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00&endTime=2020-05-10T08:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.totalAmount, 1200);
                    assert.equal(response.body.currency, "HKD");
                });
        });

        it("weekend, success getTotalAmount 2 hours, should return 200 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00&endTime=2020-05-10T09:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.totalAmount, 2400);
                    assert.equal(response.body.currency, "HKD");
                });
        });

        it("weekday, success getTotalAmount 3 hours, should return 200 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-11T08:00:00&endTime=2020-05-11T10:59:59")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.totalAmount, 3000);
                    assert.equal(response.body.currency, "HKD");
                });
        });

        it("invalid bookingType, should return 400 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-10T08:00:00&endTime=2020-05-10T08:59:59&bookingType=INVALID_BOOKING_TYPE")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.body.error, "Invalid bookingType");
                    assert.equal(response.status, 400);
                });
        });

        it("private booking, expect 0 totalAmount, should return 200 status", async () => {
            await chai.request(server)
                .get("/total-amount?startTime=2020-05-11T08:00:00&endTime=2020-05-11T10:59:59&bookingType=PRIVATE_BOOKING")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.totalAmount, 0);
                    assert.equal(response.body.currency, "HKD");
                });
        });
    });
});

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
        .then((res) => {
            if (res.status >= 200 && res.status < 300) {
                console.log("Sucessfully got accessToken!");
                response = res.json();
            } else {
                console.log("External Authentication Login API error : " + res.statusText);
            }
        });

    return response;
}