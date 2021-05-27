"use strict";
const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

const testHelper = require("./testHelper");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/users/shitSon`, REQUEST_CONFIG);
});

describe('Test findUser api', () => {
    it('test get user api', async () => {
        const setupResult = await testHelper.setupPersonAndRegisterUser();

        //find user
        let getUserResponse;
        try{
            getUserResponse = await axios.get(`${DOMAIN_URL}/user/${setupResult.userId}`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        expect(getUserResponse.data.userId).toEqual(setupResult.userId);
        expect(getUserResponse.data.status).toEqual("ACTIVE");
        expect(getUserResponse.data.registrationTime).not.toEqual(null);
    });
});