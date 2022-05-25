"use strict";
const axios = require("axios");
const common = require("./bookingTest.common");

let booking1Id;
let booking2Id;

beforeAll(async() => {
    await common.flushAllCollections();
    await common.createS123Staff();
    
    //new booking1
    const postBooking1Request = {
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
    const postBooking1Response = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBooking1Request, common.AXIO_REQUEST_CONFIG);
    booking1Id = postBooking1Response.data.bookingId;

    //new booking2
    const postBooking2Request = {
        startTime: common.getTomorrowTenAMDate(),
        endTime: common.getTomorrowElevenAMDate(),
        utcOffset:0,
        assetId:"A24",
        host: {
            name:"tester",
            phoneNumber:"12345678",
            countryCode:"852"
        },
        channelId:"HOLIMOOD"
    }
    const postBooking2Response = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBooking2Request, common.AXIO_REQUEST_CONFIG);
    booking2Id = postBooking2Response.data.bookingId;

    //fulfill booking2
    const putBooking2Request = {
        bookingId: booking2Id
    }
    await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBooking2Request, common.AXIO_REQUEST_CONFIG);
});

describe('Test cancel booking', () => {
    it("missing bookingId, 400 error!", async () => {
        const putBookingRequest = {}
        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/cancel`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("bookingId is required");
        }
    });

    it("cancel an already fulfilled booking, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: booking2Id
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/cancel`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("Cannot cancel an already fulfilled booking");
        }
    });

    it("success, 200", async () => {
        const putBookingRequest = {
            bookingId: booking1Id
        }
        const putBookingResponse = await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/cancel`, putBookingRequest, common.AXIO_REQUEST_CONFIG);

        expect.assertions(4);
        expect(putBookingResponse.status).toEqual(200);
        expect(putBookingResponse.data.bookingId).toEqual(booking1Id);
        expect(putBookingResponse.data.status).toEqual("CANCELLED");
        expect(putBookingResponse.data.occupancyId).toEqual(undefined);
    });

    it("fulfilled an already fulfilled booking, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: booking1Id
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/cancel`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("Booking already cancelled");
        }
    });
});