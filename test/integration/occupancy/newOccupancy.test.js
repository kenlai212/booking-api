const axios = require("axios");
const moment = require("moment");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/occupancies/shitSon`, REQUEST_CONFIG);
});

describe('Test post occupancy api', () => {
    it('post occupancy', async () => {
        const data = {
            startTime: moment().utcOffset(0).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString(),
            endTime:moment().utcOffset(0).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString(),
            utcOffset:8,
            assetId: "MC_NXT20",
            referenceType: "BOOKING"
        }

        let postOccupancyResponse;
        try{
            postOccupancyResponse = await axios.post(`${DOMAIN_URL}/occupancy`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }
        
        expect(postOccupancyResponse.data.occupancyId).not.toBeNull();
        expect(postOccupancyResponse.data.status).toEqual("AWAITING_CONFIRMATION");
        expect(postOccupancyResponse.data.startTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString());
        expect(postOccupancyResponse.data.endTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString());
        expect(postOccupancyResponse.data.assetId).toEqual("MC_NXT20");
        expect(postOccupancyResponse.data.referenceType).toEqual("BOOKING");

        let getOccupancyResponse;
        try{
            getOccupancyResponse = await axios.get(`${DOMAIN_URL}/occupancy/${postOccupancyResponse.data.occupancyId}`, REQUEST_CONFIG)
        }catch(error){
            console.log(error);
        }
        
        expect(getOccupancyResponse.data.occupancyId).toEqual(postOccupancyResponse.data.occupancyId);
        expect(getOccupancyResponse.data.startTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString());
        expect(getOccupancyResponse.data.endTime).toEqual(moment().utcOffset(8).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString());
        expect(getOccupancyResponse.data.assetId).toEqual("MC_NXT20");
        expect(getOccupancyResponse.data.referenceType).toEqual("BOOKING");
        expect(getOccupancyResponse.data.status).toEqual("AWAITING_CONFIRMATION");
    });
});