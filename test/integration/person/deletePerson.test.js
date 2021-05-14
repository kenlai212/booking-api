"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
});

describe('Test delete person api', () => {
    it('del person', async () => {
        //add new person1
        let postPerson1Response;
        try{
            postPerson1Response = await axios.post(`${DOMAIN_URL}/person`, {name: "person1"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //add new person2
        let postPerson2Response;
        try{
            postPerson2Response = await axios.post(`${DOMAIN_URL}/person`, {name: "person2"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //read persons, expect 2 records
        let readPersonsResponse;
        try{
            readPersonsResponse = await axios.get(`${DOMAIN_URL}/persons`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(readPersonsResponse.data.count).toEqual(2);
        
        //delete person1
        let deletePerson1Response;
        try{
            deletePerson1Response = await axios.delete(`${DOMAIN_URL}/person/${postPerson1Response.data.personId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(deletePerson1Response.data.status).toEqual("SUCCESS");

        //read persons, expect 2 records
        try{
            readPersonsResponse = await axios.get(`${DOMAIN_URL}/persons`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(readPersonsResponse.data.count).toEqual(1);
    });
});