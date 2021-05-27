const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

describe('Test assignGroup api', () => {
    it('test put user/group api', async () => {
        let searchGroupsResponse;
        try{
            searchGroupsResponse = await axios.get(`${DOMAIN_URL}/user/groups`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        console.log(searchGroupsResponse.data);
        expect(getUserResponse.data.userId).toEqual(postUserResponse.data.userId);
        expect(getUserResponse.data.status).toEqual("ACTIVE");
        expect(getUserResponse.data.registrationTime).not.toEqual(null);
        expect(getUserResponse.data.groups).toEqual(["BOOKING_ADMIN", "PRICING_ADMIN"]);
    });
});