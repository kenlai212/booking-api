const OCCUPANCY_PATH = "/occupancy";

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

module.exports = {
    occupyAsset
}