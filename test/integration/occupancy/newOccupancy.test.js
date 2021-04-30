const axios = require("axios");

const occupancyDomain = require("../../../src/occupancy/occupancy.domain");

const bookingAPIUser = require("../../../src/common/bookingAPIUser");

beforeEach(async () => await occupancyDomain.deleteAllOccupancies("shitSon"));
//afterEach(async () => await occupancyDomain.deleteAllOccupancies("shitSon"));

describe('Test post occupancy api', () => {
    const postOccupancyURL = "http://localhost/occupancy";

    const REQUEST_CONFIG = {
        headers:{
            'Authorization': `token ${bookingAPIUser.getAccessToken()}`
        }
    }

    it('save occupancy', async done => {
        const data = {
            startTime: "2021-05-01T08:00:00",
            endTime:"2021-05-01T08:00:00",
            utcOffset:8,
            assetId: "MC_NXT20",
            referenceType: "BOOKING"
        }

        await axios.post(postOccupancyURL, data, REQUEST_CONFIG);
    });
});