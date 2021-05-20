"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/authentication/claims/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/authentication/credentialses/shitSon`, REQUEST_CONFIG);
});

describe('Test new claim api', () => {
    it('post claim', async () => {
        const data = {
            "userId":"A",
            "personId":"B",
            "userStatus":"ACTIVE",
            "groups":["AUTHENTICATION_ADMIN","BOOKING_ADMIN"],
            "roles":["CUSTOMER","STAFF","INTERNAL_ADMIN"]
        }

        let postClaimResponse;
        try{
            postClaimResponse = await axios.post(`${DOMAIN_URL}/authentication/claim`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postClaimResponse.data.userId).toEqual("A");
        expect(postClaimResponse.data.personId).toEqual("B");
        expect(postClaimResponse.data.userStatus).toEqual("ACTIVE");
        expect(postClaimResponse.data.groups).toEqual(["AUTHENTICATION_ADMIN","BOOKING_ADMIN"]);
        expect(postClaimResponse.data.roles).toEqual(["CUSTOMER","STAFF","INTERNAL_ADMIN"]);
    });
});
