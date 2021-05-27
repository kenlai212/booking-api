"use strict";
const axios = require("axios");
const jwt = require("jsonwebtoken");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/authentication/claims/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/authentication/credentialses/shitSon`, REQUEST_CONFIG);
});

describe('Test login api', () => {
    it('post login', async () => {
        //post register
        const data = {
            "loginId":"A",
            "password":"B",
            "userId":"C",
            "userStatus":"ACTIVE",
            "personId":"D",
            "groups":["BOOKING_ADMIN","PRICING_USER"],
            "roles":["CUSTOMER","STAFF"]
        }

        let registerResponse;
        try{
            registerResponse = await axios.post(`${DOMAIN_URL}/authentication/register`, data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        expect(registerResponse.data.status).toEqual("SUCCESS");

        //post login
        const loginData = {
            "loginId":"A",
            "password":"B"
        }

        let loginResponse
        try{
            loginResponse = await axios.post(`${DOMAIN_URL}/authentication/login`, loginData, REQUEST_CONFIG);
        }catch(error){
            console.error(error);         
        }

        let claim
        jwt.verify(loginResponse.data, process.env.ACCESS_TOKEN_SECRET, (err, claim) => {
            if (err) {
                console.error("Error while verifying accessToken, running jwt.verify()", err);
            } else {
                expect(claim.userId).toEqual("C");
                expect(claim.personId).toEqual("D");
                expect(claim.userStatus).toEqual("ACTIVE");
                expect(claim.groups).toEqual(["BOOKING_ADMIN","PRICING_USER"]);
                expect(claim.roles).toEqual(["CUSTOMER","STAFF"]);
            }
        });
    });
});