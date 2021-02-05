const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const occupancyService = require("../occupancy/occupancy.service");

async function occupyAsset(input, user){
    try{
        await occupancyService.occupyAsset(input, user);
    }catch(error){
        console.log(error);
        logger.error("Error while calling occupancyService.occupyAsset : ", error);
        throw error;
    }
}

async function releaseOccupancy(input, user) {
    try {
        return await occupancyService.releaseOccupancy(input, user);
    } catch (err) {
        logger.error("Error while calling occupancyService.releaseOccupancy : ", err);
        throw err;
    }
}

module.exports = {
    //occupyAsset,
    //releaseOccupancy
}