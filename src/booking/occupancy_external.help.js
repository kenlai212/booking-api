const OCCUPANCY_PATH = "/occupancy";
const RELEASE_OCCUPANCY_PATH = "/occupancy";

function occupyAsset(startTime, endTime, assetId){
    return new Promise((resolve, reject) => {
        const url = process.env.OCCUPANCY_DOMAIN + OCCUPANCY_PATH;
        const data = {
            "occupancyType": CUSTOMER_BOOKING_TYPE,
            "startTime": gogowakeCommon.dateToStandardString(startTime),
            "endTime": gogowakeCommon.dateToStandardString(endTime),
            "assetId": assetId
        }
        const requestAttr = {
            method: "POST",
            headers: {
                "content-Type": "application/json",
                "Authorization": "Token " + global.accessToken
            },
            body: JSON.stringify(data)
        }
    
        gogowakeCommon.callAPI(url, requestAttr)
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            });
    });
}

function releaseOccupancy(occupancyId) {
    return new Promise((resolve, reject) => {
        const url = process.env.OCCUPANCY_DOMAIN + RELEASE_OCCUPANCY_PATH;
        const data = {
            "occupancyId": occupancyId
        }
        const requestAttr = {
            method: "DELETE",
            headers: {
                "content-Type": "application/json",
                "Authorization": "Token " + user.accessToken
            },
            body: JSON.stringify(data)
        }

        gogowakeCommon.callAPI(url, requestAttr)
            .then(() => {
                resolve();
            })
            .catch(err => {
                reject(err);
            });
    });
}

module.exports = {
    occupyAsset,
    releaseOccupancy
}