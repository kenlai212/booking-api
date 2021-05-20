"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/authentication/claims/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/authentication/credentialses/shitSon`, REQUEST_CONFIG);
});

describe('Test new credentials api', () => {
    it('post credentials', async () => {
        const credentials1Input = {
            "userId":"A",
            "loginId":"B",
            "password":"C"
        }

        let postCredentials1Response;
        try{
            postCredentials1Response = await axios.post(`${DOMAIN_URL}/authentication/credentials`, credentials1Input, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postCredentials1Response.data.userId).toEqual("A");
        expect(postCredentials1Response.data.loginId).toEqual("B");
        expect(postCredentials1Response.data.password).toEqual("C");

        const credentials2Input = {
            "userId":"D",
            "provider":"GOOGLE",
            "providerUserId":"F"
        }

        let postCredentials2Response;
        try{
            postCredentials2Response = await axios.post(`${DOMAIN_URL}/authentication/credentials`, credentials2Input, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postCredentials2Response.data.userId).toEqual("D");
        expect(postCredentials2Response.data.provider).toEqual("GOOGLE");
        expect(postCredentials2Response.data.providerUserId).toEqual("F");
    });
});