"use strict";
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
const Joi = require("joi");
const moment = require("moment");
const config = require("config");

const logger = require("../common/logger").logger;
const customError = require("../common/customError");
const userAuthorization = require("../common/middleware/userAuthorization");

const NOTIFICATION_ADMIN_GROUP = "NOTIFICATION_ADMIN";
const NOTIFICATION_POWER_USER_GROUP = "NOTIFICATION_POWER_USER";
const NOTIFICATION_USER_GROUP = "NOTIFICATION_USER";

module.exports = {}