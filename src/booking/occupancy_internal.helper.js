const logger = require("../common/logger").logger;

const bookingAPIUser = require("../common/bookingAPIUser");
const occupancyService = require("../occupancy/occupancy.service");

function occupyAsset(startTime, endTime, assetId, occupancyType){
    return new Promise((resolve, reject) => {
        input = {
            startTime: startTime,
            endTime: endTime,
            assetId: assetId,
            occupancyType: occupancyType
        }

        occupancyService.occupyAsset(input, bookingAPIUser.userObject)
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                logger.error("Error while call occupancyService.occupyAsset : ", err);
                reject(err);
            });
    });
}

function releaseOccupancy(occupancyId) {
    return new Promise((resolve, reject) => {
        input = {
            occupancyId: occupancyId
        }

        occupancyService.releaseOccupancy(input, bookingAPIUser.userObject)
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                logger.error("Error while call occupancyService.releaseOccupancy : ", err);
                reject(err);
            });
    });
}

module.exports = {
    occupyAsset,
    releaseOccupancy
}