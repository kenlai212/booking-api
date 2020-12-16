const logger = require("../common/logger").logger;
const customError = require("../common/customError");

const occupancyService = require("../occupancy/occupancy.service");

async function checkAvailability(input, user){
    let result;
    try {
        result = await occupancyService.checkAvailability(input, user);
    } catch (err) {
        logger.error("Error while calling occupancyService.occupyAsset : ", err);
        throw err;
    }

    if(result.isAvailable == false){
        throw { name: customError.BAD_REQUEST_ERROR, message: "Timeslot not available" };
    }
}

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
    checkAvailability,
    occupyAsset,
    releaseOccupancy
}