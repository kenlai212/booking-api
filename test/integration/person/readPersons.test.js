"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
});

describe('Test read person api', () => {
    it('get person', async () => {
        //add person 1
        try{
            await axios.post(`${DOMAIN_URL}/person`, {name: "person1"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //add person 2
        try{
            await axios.post(`${DOMAIN_URL}/person`, {name: "person2"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //get persons
        let getPersonsResponse;
        try{
            getPersonsResponse = await axios.get(`${DOMAIN_URL}/persons`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getPersonsResponse.data.count).toEqual(2);
        
        //get persons by name
        let getPersonsByNameResponse;
        try{
            getPersonsByNameResponse = await axios.get(`${DOMAIN_URL}/persons?name=person1`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getPersonsByNameResponse.data.count).toEqual(1);
    });
});