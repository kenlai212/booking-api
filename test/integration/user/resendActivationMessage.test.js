"use strict";
const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

const testHelper = require("./testHelper");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/users/shitSon`, REQUEST_CONFIG);
});

describe('Test resendActivationMessage api', () => {
    it('test post user/activation-message api', async () => {
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

        //send activation message
        const postActivationMessageData ={
            userId: setupResult.userId
        }

        let postActivationMessageResponse;
        try{
            postActivationMessageResponse = await axios.post(`${DOMAIN_URL}/user/activation-messaage`, postActivationMessageData, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        expect(postActivationMessageResponse.data.status).toEqual("SUCCESS");

        //find user again
        try{
            getUserResponse = await axios.get(`${DOMAIN_URL}/user/${setupResult.userId}`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        expect(getUserResponse.data.userId).toEqual(setupResult.userId);
        expect(getUserResponse.data.status).toEqual("AWAITING_ACTIVATION");
        expect(getUserResponse.data.registrationTime).not.toEqual(null);
    });
});