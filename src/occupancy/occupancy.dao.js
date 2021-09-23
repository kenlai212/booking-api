"use strict";
const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {Occupancy} = require("./occupancy.model");

async function save(occupancy){
    try{
        occupancy = await occupancy.save();
    }catch(error){
        logger.error("occupancy.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save occupancy Error" };
    }

    return occupancy;
}

async function find(occupancyId){
    let occupancy;
    try{
        occupancy = await Occupancy.findById(occupancyId);
    }catch(error){
        logger.error("occupancy.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find occupancy Error" };
    }

    return occupancy;
}

async function del(occupancyId){
    try{
        await Occupancy.findByIdAndDelete(occupancyId);
    }catch(error){
        logger.error("occupancy.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete occupancy Error" };
    }

    return;
}

async function deleteAll(){
    try{
        await Occupancy.deleteMany();
    }catch(error){
        logger.error("occupancy.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete occupancy Error" };
    }

    return;
}

module.exports = {
	save,
    find,
    del,
    deleteAll
}