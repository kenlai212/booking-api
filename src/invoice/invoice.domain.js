"use strict";
const Joi = require("joi");

const utility = require("../common/utility");
const {logger, customError} = utility;

const { Invoice } = require("./invoice.model");

async function createInvoice(input){
    const schema = Joi.object({
		bookingId: Joi.string().required(),
        currency: Joi.string().required(),
        status: Joi.string().required(),
        items: Joi.array().items(
            Joi.object({
                itemCode: Joi.string(),
                unit: Joi.number(),
                unitPrice: Joi.number()
            })
        ),
		discounts: Joi
			.array()
			.items(Joi.object({
				amount: Joi.number(),
				discountCode: Joi.string().required()
			}))
	});
	utility.validateInput(schema, input);

	let invoice = new Invoice();
	invoice.bookingId = input.bookingId;
    invoice.currency = input.currency;
    invoice.status = input.status;

    //set items
    invoice.items = [];
    input.items.forEach(item => {
        invoice.items.push({
            itemCode: item.itemCode,
            unit: item.unit,
            unitPrice: item.unitPrice
        });
    });

    //set discounts
	if(input.discount){
        invoice.discounts = [];

		input.discount.forEach(discount => {
            invoice.discounts.push({
                amount: discount.amount,
                discountCode: discount.discountCode
            });
		});
	}

	try{
		invoice = await invoice.save()
	}catch(error){
		logger.error("invoice.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Invoice Error" };
	}

	return invoice;
}

async function readInvoice(bookingId){
    if (!mongoose.Types.ObjectId.isValid(bookingId))
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	let invoice;
	try {
		invoice = await Invoice.findOne({bookingId: input.bookingId});
	} catch (err) {
		logger.error("Invoice.findOne Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Invoice Error" };
	}
	
	if (!invoice)
		throw { name: customError.RESOURCE_NOT_FOUND_ERROR, message: "Invalid bookingId" };

	return invoice;
}

async function updateInvoice(invoice){
    try{
		invoice = await invoice.save()
	}catch(error){
		logger.error("invoice.save Error", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Invoice Error" };
	}

	return invoice;
}

module.exports = {
	createInvoice,
    readInvoice,
    updateInvoice
}