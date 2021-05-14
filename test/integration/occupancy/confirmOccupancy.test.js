"use strict";
const axios = require("axios");
const moment = require("moment");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/occupancies/shitSon`, REQUEST_CONFIG);
});

describe('Test confirm occupancy api', () => {
    it('put occupancy/confirm', async () => {
        const newOccupancyInput = {
            startTime: moment().utcOffset(0).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString(),
            endTime:moment().utcOffset(0).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString(),
            utcOffset:8,
            assetId: "MC_NXT20",
            referenceType: "BOOKING"
        }

        let postOccupancyResponse;
        try{
            postOccupancyResponse = await axios.post(`${DOMAIN_URL}/occupancy`, newOccupancyInput, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }
        
        expect(postOccupancyResponse.data.occupancyId).not.toBeNull();
        expect(postOccupancyResponse.data.status).toEqual("AWAITING_CONFIRMATION");
        expect(postOccupancyResponse.data.startTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString());
        expect(postOccupancyResponse.data.endTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString());
        expect(postOccupancyResponse.data.assetId).toEqual("MC_NXT20");
        expect(postOccupancyResponse.data.referenceType).toEqual("BOOKING");

        const confirmOccupancyInput = {
            occupancyId: postOccupancyResponse.data.occupancyId,
            referenceType: "BOOKING",
            referenceId: "A"
        }

        let confirmOccupancyResponse;
        try{
            confirmOccupancyResponse = await axios.put(`${DOMAIN_URL}/occupancy/confirm`, confirmOccupancyInput, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(confirmOccupancyResponse.data.occupancyId).toEqual(postOccupancyResponse.data.occupancyId);
        expect(confirmOccupancyResponse.data.status).toEqual("CONFIRMED");
        expect(confirmOccupancyResponse.data.startTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString());
        expect(confirmOccupancyResponse.data.endTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString());
        expect(confirmOccupancyResponse.data.assetId).toEqual("MC_NXT20");
        expect(confirmOccupancyResponse.data.referenceType).toEqual("BOOKING");
        expect(confirmOccupancyResponse.data.referenceId).toEqual("A");
    });
});