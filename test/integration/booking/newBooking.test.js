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
            startTime: moment().utcOffset(0).add(1, "days").set({hour:8,minute:0,second:0,millisecond:0}).toISOString(),
            endTime:moment().utcOffset(0).add(1, "days").set({hour:8,minute:59,second:59,millisecond:0}).toISOString(),
            utcOffset:8,
            assetId: "MC_NXT20",
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
        expect(postBookingResponse.data.occupancyId).not.toEqual(null);
        expect(postBookingResponse.data.customerId).toEqual(postCustomerResponse.data.customerId);

        //get bookingHistory
        let getBookingHistoryResponse;
        try{
            getBookingHistoryResponse = await axios.get(`${DOMAIN_URL}/booking/history/${postBookingResponse.data.bookingId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getBookingHistoryResponse.data.bookingId).toEqual(postBookingResponse.data.bookingId);
        expect(getBookingHistoryResponse.data.history.length).toEqual(1);
        expect(getBookingHistoryResponse.data.history[0].event).toEqual("New Booking");
        expect(getBookingHistoryResponse.data.history[0].eventTime).not.toEqual(null);
        expect(getBookingHistoryResponse.data.history[0].requestor).toEqual("BOOKING_SYSTEM");

        //get occupancy, expect status to confirm
        //wait for 2 seconds for confirm occupancy event to propergate 
        setTimeout(async () => {
            let getOccupancyResponse;
            try{
                getOccupancyResponse = await axios.get(`${DOMAIN_URL}/occupancy/${postBookingResponse.data.occupancyId}`, REQUEST_CONFIG);
            }catch(error){
                console.log(error);
            }

            expect(getOccupancyResponse.data.status).toEqual("CONFIRMED");
        }, 2000);
    });
});