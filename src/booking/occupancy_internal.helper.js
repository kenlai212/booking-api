const occupancyService = require("../occupancy/occupancy.service");

function occupyAsset(startTime, endTime, assetId, occupancyType){
    return new Promise((resolve, reject) => {
        var user = new Object();
        jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
            if (err) {
                throw { name: customError.JWT_ERROR, message: err.message };
            } else {
                user = targetUser;
            }
        });

        input = {
            startTime: startTime,
            endTime: endTime,
            assetId: assetId,
            occupancyType: occupancyType
        }

        occupancyService.occupyAsset(input, user)
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
        var user = new Object();
        jwt.verify(global.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, targetUser) => {
            if (err) {
                throw { name: customError.JWT_ERROR, message: err.message };
            } else {
                user = targetUser;
            }
        });

        input = {
            occupancyId: occupancyId
        }

        occupancyService.releaseOccupancy(input, user)
            .then(result => {
                resolve(result);
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