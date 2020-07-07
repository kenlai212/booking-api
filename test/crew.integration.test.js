const chai = require("chai");
var chaiHttp = require("chai-http");
const server = require("../server");
const Crew = require("../src/crew/crew.model").Crew;
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

    describe("testing add new crew", function () {

        before(async () => {
            await deleteAll();
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .post("/crew")
                .send()
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing crewName, should return 400 status", async () => {
            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({})
                .then(response => {
                    assert.equal(response.body.error, "crewName is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("missing telephoneCountryCode, should return 400 status", async () => {
            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Tester"
                })
                .then(response => {
                    assert.equal(response.body.error, "telephoneCountryCode is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("missing telephoneNumber, should return 400 status", async () => {
            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Tester",
                    "telephoneCountryCode": "852"
                })
                .then(response => {
                    assert.equal(response.body.error, "telephoneNumber is mandatory");
                    assert.equal(response.status, 400);
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Tester",
                    "telephoneCountryCode": "852",
                    "telephoneNumber":"12345678"
                })
                .then(response => {
                    assert.equal(response.status, 200);
                    assert(response.body.id);
                    assert(response.body.crewName);
                });
        });
    });

    describe("testing find crew", function () {

        var crew1;

        before(async () => {
            await Crew.deleteMany().exec()
                .catch(err => { console.log(err); });

            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Crew 1",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678"
                })
                .then(result => {
                    crew1 = result.body;
                });

            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Crew 2",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "34567890"
                });
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .get("/crew")
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("missing crewId, should return 400 status", async () => {
            await chai.request(server)
                .get("/crew")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "crewId is mandatory");
                });
        });

        it("invalid crewId, should return 400 status", async () => {
            await chai.request(server)
                .get("/crew?crewId=123")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 400);
                    assert.equal(response.body.error, "Invalid crewId");
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .get("/crew?crewId=" + crew1.id)
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.id, crew1.id);
                    assert.equal(response.body.crewName, crew1.crewName);
                    assert.equal(response.body.telephoneCountryCode, "852");
                    assert.equal(response.body.telephoneNumber, "12345678");
                });
        });
    });

    describe("testing search crews", function () {

        before(async () => {
            await Crew.deleteMany().exec()
                .catch(err => { console.log(err); });

            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Crew 1",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "12345678"
                })
                .then(result => {
                    crew1 = result.body;
                });

            await chai.request(server)
                .post("/crew")
                .set("Authorization", "Token " + accessToken)
                .send({
                    "crewName": "Crew 2",
                    "telephoneCountryCode": "852",
                    "telephoneNumber": "34567890"
                });
        });

        it("missing accessToken, should return 401 status", async () => {
            await chai.request(server)
                .get("/crews")
                .then(response => {
                    assert.equal(response.status, 401);
                });
        });

        it("success, should return 200 status", async () => {
            await chai.request(server)
                .get("/crews")
                .set("Authorization", "Token " + accessToken)
                .then(response => {
                    assert.equal(response.status, 200);
                    assert.equal(response.body.crews.length, 2);
                    assert.equal(response.body.crews[0].crewName, "Crew 1");
                    assert.equal(response.body.crews[0].telephoneCountryCode, "852");
                    assert.equal(response.body.crews[0].telephoneNumber, "12345678");
                });
        });
    });
});

async function deleteAll() {
    await Crew.deleteMany().exec();
}
