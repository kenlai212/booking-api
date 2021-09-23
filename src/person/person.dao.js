"use strict";
const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {Person} = require("./person.model");

async function save(person){
    try{
        person = await person.save();
    }catch(error){
        logger.error("person.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save person Error" };
    }

    return person;
}

async function find(personId){
    let person;
    try{
        person = await Person.findById(personId);
    }catch(error){
        logger.error("person.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find person Error" };
    }

    return person;
}

async function del(personId){
    try{
        await Person.findByIdAndDelete(personId);
    }catch(error){
        logger.error("person.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete person Error" };
    }

    return;
}

async function deleteAll(){
    try{
        await Person.deleteMany();
    }catch(error){
        logger.error("person.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete person Error" };
    }

    return;
}

module.exports = {
	save,
    find,
    del,
    deleteAll
}