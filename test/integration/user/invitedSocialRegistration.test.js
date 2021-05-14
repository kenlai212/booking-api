const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
});

describe('Test user api', () => {
    it('test post user api', async () => {
        const data = {
            name: "ken"
        }

        let postUserResponse;
        try{
            postUserResponse = await axios.post(`${DOMAIN_URL}/user`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postUserResponse.data.personId).not.toEqual(null);
        expect(postUserResponse.data.creationTime).not.toEqual(null);
        expect(postUserResponse.data.lastUpdateTime).not.toEqual(null);
        expect(postUserResponse.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(postUserResponse.data.name).toEqual("ken");
    });
});