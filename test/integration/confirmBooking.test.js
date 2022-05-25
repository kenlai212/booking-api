"use strict";
const axios = require("axios");
const common = require("./bookingTest.common");

let bookingId;

beforeAll(async() => {
    await common.flushAllCollections();
    await common.createS123Staff();
    
    const postBookingRequest = {
        startTime: common.getTomorrowEightAMDate(),
        endTime: common.getTomorrowNineAMDate(),
        utcOffset:0,
        assetId:"A24",
        host: {
            name:"tester",
            phoneNumber:"12345678",
            countryCode:"852"
        },
        channelId:"HOLIMOOD"
    }
    const postBookingResponse = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
    bookingId = postBookingResponse.data.bookingId;
});

describe('Test confirm booking', () => {
    it("missing bookingId, 400 error!", async () => {
        const putBookingRequest = {}
        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/confirm`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("bookingId is required");
        }
    });

    it("success, 200", async () => {
        const putBookingRequest = {
            bookingId: bookingId
        }
        const putBookingResponse = await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/confirm`, putBookingRequest, common.AXIO_REQUEST_CONFIG);

        expect.assertions(3);
        expect(putBookingResponse.status).toEqual(200);
        console.log(putBookingResponse.data);
        expect(putBookingResponse.data.bookingId).toEqual(bookingId);
        expect(putBookingResponse.data.status).toEqual("CONFIRMED");
    });
});