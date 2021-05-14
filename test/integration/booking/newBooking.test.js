"use strict";
const moment = require("moment");
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/occupancies/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/bookings/shitSon`, REQUEST_CONFIG);
});

describe('Test post booking api', () => {
    it('save booking', async () => {
        //post occupancy
        const postOccupancyData = {
            startTime: moment().utcOffset(0).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString(),
            endTime:moment().utcOffset(0).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString(),
            utcOffset:8,
            assetId: "MC_NXT20",
            referenceType: "BOOKING"
        }
    
        let postOccupancyResponse;
        try{
            postOccupancyResponse = await axios.post(`${DOMAIN_URL}/occupancy`, postOccupancyData, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postOccupancyResponse.data.status).toEqual("AWAITING_CONFIRMAION");
    
        //post customer
        const data = {
            name: "customer1",
            emailAddress: "test@test.com",
            countryCode: "852",
            phoneNumber: "1234567"
        }

        let postCustomerResponse;
        try{
            postCustomerResponse = await axios.post(`${DOMAIN_URL}/customer`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //post booking
        const postBookingData = {
            occupancyId: postOccupancyResponse.data.occupancyId,
            bookingType: "CUSTOMER_BOOKING",
            customerId: postCustomerResponse.data.customerId
        }
    
        let postBookingResponse;
        try{
            postBookingResponse = await axios.post(`${DOMAIN_URL}/booking`, postBookingData, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postBookingResponse.data.bookingId).not.toEqual(null);
        expect(postBookingResponse.data.bookingType).toEqual("CUSTOMER_BOOKING");
        expect(postBookingResponse.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(postBookingResponse.data.status).toEqual("AWAITING_CONFIRMATION");
        expect(postBookingResponse.data.occupancyId).toEqual(postOccupancyResponse.data.occupancyId);
        expect(postBookingResponse.data.customerId).toEqual(postCustomerResponse.data.customerId);

        //get occupancy, expect status to confirm
        let getOccupancyResponse;
        try{
            getOccupancyResponse = await axios.get(`${DOMAIN_URL}/occupancy/${getOccupancyResponse.data.occupancyId}`, postBookingData, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getOccupancyResponse.data.status).toEqual("CONFIRMED");
    });
});