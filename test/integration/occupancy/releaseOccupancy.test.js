"use strict";
const axios = require("axios");
const moment = require("moment");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/occupancies/shitSon`, REQUEST_CONFIG);
});

describe('Test release occupancy api', () => {
    it('del occupancy', async () => {
        //post occupancy1
        const newOccupancyInput1 = {
            startTime: moment().utcOffset(0).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString(),
            endTime:moment().utcOffset(0).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString(),
            utcOffset:8,
            assetId: "MC_NXT20",
            referenceType: "BOOKING"
        }

        let postOccupancyResponse1;
        try{
            postOccupancyResponse1 = await axios.post(`${DOMAIN_URL}/occupancy`, newOccupancyInput1, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }
        
        //post occupancy2
        const newOccupancyInput2 = {
            startTime: moment().utcOffset(0).add(1, "days").set({hour:9,minute:0,second:0,millisecond:0}).toISOString(),
            endTime:moment().utcOffset(0).add(1, "days").set({hour:9,minute:59,second:59,millisecond:0}).toISOString(),
            utcOffset:8,
            assetId: "MC_NXT20",
            referenceType: "BOOKING"
        }

        let postOccupancyResponse2;
        try{
            postOccupancyResponse2 = await axios.post(`${DOMAIN_URL}/occupancy`, newOccupancyInput2, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //search all occupancies, expect 2 records count
        let searchOccupanciesResponse;
        try{
            searchOccupanciesResponse = await axios.get(`${DOMAIN_URL}/occupancies/?startTime=2021-01-01T00:00:00&endTime=2021-12-31T00:00:00&utcOffset=0&assetId=MC_NXT20`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }
        
        expect(searchOccupanciesResponse.data.count).toEqual(2);

        //release occupancy1
        let releaseOccupancyResponse;
        try{
            releaseOccupancyResponse = await axios.delete(`${DOMAIN_URL}/occupancy/${postOccupancyResponse1.data.occupancyId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(releaseOccupancyResponse.data.status).toEqual("SUCCESS");

        //search all occupancies again, should expect 1 record count
        try{
            searchOccupanciesResponse = await axios.get(`${DOMAIN_URL}/occupancies/?startTime=2021-01-01T00:00:00&endTime=2021-12-31T00:00:00&utcOffset=0&assetId=MC_NXT20`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }
        
        expect(searchOccupanciesResponse.data.count).toEqual(1);
    });
});