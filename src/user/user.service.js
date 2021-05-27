"use strict";
const Joi = require("joi");
const uuid = require("uuid");
const config = require("config");

const utility = require("../common/utility");
const {logger, customError} = utility;

const userDomain = require("./user.domain");
const userHelper = require("./user.helper");
const personDomain = require("./person.domain");
const externalAuthenticationService = require("./externalAuthentication.service");

const ACTIVE_STATUS = "ACTIVE";

const USER_STATUS_CHANGED_QUEUE_NAME = "USER_STATUS_CHANGED";
const USER_GROUPS_CHANGED_QUEUE_NAME = "USER_GROUPS_CHANGED";
const SEND_MESSAGE_QUEUE_NAME = "SEND_MESSAGE";

async function activate(input) {
	const schema = Joi.object({
		activationKey: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let user = userDomain.readUserByActivationKey(input.activationKey);

	//hold old status and activation key, incase we need to roll back
	const oldStatus = {...user.status}
	const oldActivationKey = {...user.activationKey};

	user.status = "ACTIVE";
	user.lastUpdateTime = new Date();
	user.activationKey = undefined;
	user = await userDomain.updateUser(user);

	const statusChangeEvent = {
		userId: user._id,
		userStatus: user.status
	}

	await utility.publishEvent(statusChangeEvent, USER_STATUS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back user activation");
		
		user.status = oldStatus;
		user.activationKey = oldActivationKey;
		await userDomain.updateUser(user);
	});

	logger.info(`User(userId:${user._id}) activated`);

	return userHelper.userToOutputObj(user);
}

async function adminActivate(input){
	const schema = Joi.object({
		userId: Joi.string().required(),
	});
	utility.validateInput(schema, input);

	let user = await userDomain.readUser(input.userId);

	//hold old status and activation key, incase we need to roll back
	const oldStatus = {...user.status}
	const oldActivationKey = {...user.activationKey};

	user.status = "ACTIVE";
	user.lastUpdateTime = new Date();

	logger.info(`User(userId:${user._id}) activated`);

	user = await userDomain.updateUser(user);

	const statusChangeEvent = {
		userId: input.userId,
		userStatus: user.status
	}

	await utility.publishEvent(statusChangeEvent, USER_STATUS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back user activation");
		
		user.status = oldStatus;
		user.activationKey = oldActivationKey;
		await userDomain.updateUser(user);
	});

	logger.info(`Admin activated User(userId:${input.userId})`);

	return userHelper.userToOutputObj(user); 
}

async function deactivate(input){
	const schema = Joi.object({
		userId: Joi.string().required(),
	});
	utility.validateInput(schema, input);

	let user = userDomain.readUser(input.userId);

	oldStatus = {...user.status};

	user.status = "INACTIVE";
	user.lastUpdateTime = new Date();

	user = await userDomain.updateUser(user);
	
	const statusChangeEvent = {
		userId: input.userId,
		userStatus: user.status
	}

	await utility.publishEvent(statusChangeEvent, USER_STATUS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back user deactivation");
		
		user.status = oldStatus;
		await userDomain.updateUser(user);
	});

	logger.info(`User(userId:${input.userId}) deactivated`);

	return userHelper.userToOutputObj(user);
}

async function unassignGroup(input) {
	const schema = Joi.object({
		userId: Joi.string().required(),
		groupId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	userHelper.validateGroupId(input.groupId);
	
	let user = await userDomain.readUser(input.userId);
	
	const oldGroups = {...user.groups}

	if(user.groups){
		user.groups.forEach(function (groupId, index, object) {
			if (groupId === input.groupId) {
				object.splice(index, 1);
			}
		});
	}
	
	user = await userDomain.updateUser(user);
	
	const userGroupsChangedEvent = {
		userId: input.userId,
		groups: user.groups
	}

	await utility.publishEvent(userGroupsChangedEvent, USER_GROUPS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back unassignGroup");
		
		user.groups = oldGroups;
		await userDomain.updateUser(user);
	});

	logger.info(`Unassigned group(${input.groupId}) for User(userId:${input.userId})`);

	return userHelper.userToOutputObj(user);
}

async function assignGroup(input) {
	const schema = Joi.object({
		userId: Joi.string().required(),
		groupId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	userHelper.validateGroupId(input.groupId);

	let user = await userDomain.readUser(input.userId);

	const oldGroups = {...user.groups};

	//see if target group already assigned to target user
	if(user.groups){
		user.groups.forEach(group => {
			if (group == input.groupId) {
				throw { name: customError.BAD_REQUEST_ERROR, message: "Group alredy assigned to this user" };
			}
		})
	}else{
		user.groups = [];
	}

	user.groups.push(input.groupId);

	user = await userDomain.updateUser(user);

	const userGroupsChangedEvent = {
		userId: input.userId,
		groups: user.groups
	}

	await utility.publishEvent(userGroupsChangedEvent, USER_GROUPS_CHANGED_QUEUE_NAME, null, async () => {
		logger.error("rolling back assignGroup");
		
		user.groups = oldGroups;
		await userDomain.updateUser(user);
	});

	logger.info(`Assinged new group(${input.groupId}) to User(${input.userId})`);

	return userHelper.userToOutputObj(user);
}

async function searchGroups(input) {
	console.log("diu");
	return userHelper.validGroupIds;
}

async function deleteUser(input) {
	const schema = Joi.object({
		userId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	await userDomain.deleteUser(input.userId);

	logger.info(`Deleted User(userId:${input.userId})`);

	return {status: "SUCCESS"};
}

async function resendActivationMessage(input) {
	const schema = Joi.object({
		userId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let user = await userDomain.readUser(input.userId);

	const oldActivationKey = {...user.activationKey};
	const oldStatus = {...user.status}

	user.activationKey = uuid.v4();
	user.lastUpdateTime = new Date();
	user.status = "AWAITING_ACTIVATION";

	user = await userDomain.updateUser(user);

	//assemble activation message
	const activationURL = config.get("user.activation.activationURL") + "/" + user.activationKey;
    const body = "<p>Click <a href='" + activationURL + "'>here</a> to activate your account!</p>";
	const msg = {
		personId: user.personId,
		subject: "Activate your account",
		message: body
	}

	await utility.publishEvent(msg, SEND_MESSAGE_QUEUE_NAME, null, async () => {
		logger.error("rolling back send activation");
		
		user.status = oldStatus;
		user.activationKey = oldActivationKey;
		await userDomain.updateUser(user);
	});

	logger.info(`Sent activation message to User(${input.userId})`);

	return {status: "SUCCESS"};
}

async function sendRegistrationInvite(input){
	const schema = Joi.object({
		userId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let user = userDomain.readUser(input.userId);

	let invitation = {
		personId: user.personId,
		subject: "Registration Invite",
		message: "Please click on the following link to register"
	}

	await utility.publishEvent(invitation, SEND_MESSAGE_QUEUE_NAME, null,() => {
		throw { name: customError.INTERNAL_SERVER_ERROR, message: `Failed to publish SEND_MESSAGE event` };
	});

	logger.info(`Sent registration invite to User(${input.userId})`);

	return {status: "SUCCESS"};
}

async function deleteAllUsers(input){
	const schema = Joi.object({
		passcode: Joi.string().required()
	});
	utility.validateInput(schema, input);

	if(process.env.NODE_ENV != "development")
	throw { name: customError.BAD_REQUEST_ERROR, message: "Cannot perform this function" }

	if(input.passcode != process.env.GOD_PASSCODE)
	throw { name: customError.BAD_REQUEST_ERROR, message: "You are not GOD" }

	await userDomain.deleteAllUsers();

	logger.info("Delete all users");

	return {status: "SUCCESS"}
}

async function findUser(input) {
	const schema = Joi.object({
		userId: Joi.string(),
		personId: Joi.string(),
		provider: Joi.string(),
		providerUserId: Joi.string()
	});
	utility.validateInput(schema, input);

	if(!input.userId && !input.personId && !input.providerUserId)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Must provide userId or personId or providerUserId" };

	let user;
	if(input.userId)
	user = await userDomain.readUser(input.userId);
	else if(input.personId)
	user = await userDomain.readUserByPersonId(input.userId);
	else if(input.providerUserId)
	user = await userDomain.readUserBySocialProfile(input.provider, input.providerUserId);

	return userHelper.userToOutputObj(user);
}

async function searchUsers(input) {
	//TODO!!!! add paginateion
	let users = await userDomain.readUsers();

	let outputObjs = [];
	users.forEach(user => {
		outputObjs.push(userHelper.userToOutputObj(user));
	});

	return {
		count: outputObjs.length,
		users: outputObjs
	}
}

async function invitedSocialRegister(input){
	const schema = Joi.object({
		provider: Joi.string().required(),
		providerToken: Joi.string().required(),
		personId: Joi.string().required()
	});
	utility.validateInput(schema, input);

	let person = await personDomain.readPerson(input.personId);

	//get user attributes form provider token
	let socialProfile;
	switch(input.provider){
		case "GOOGLE":
			socialProfile = await userHelper.getSocialProfileFromGoogle(input.providerToken);
			break;
		case "FACEBOOK":
			socialProfile = await userHelper.getSocialProfileFromFacebook(input.providerToken);
			break;
		default:
			throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid Provider" };
	}

	//check social profile already used
	let existingUser = await userDomain.readUserBySocialProfile(socialProfile.provider, socialProfile.providerUserId);

	if (existingUser)
	throw { name: customError.BAD_REQUEST_ERROR, message: "providerUserId already registered" };
	
	//check if person is already registered
	existingUser = await userDomain.readUserByPersonId(input.personId);

	if (existingUser)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Person already registered" };

	//create new user
	const createUserInput = {
		registrationTime: new Date(),
		activationKey: uuid.v4(),
		status: ACTIVE_STATUS,
		provider: input.provider,
		providerUserId: input.providerUserId,
		personId: input.personId,
	}
		
	const user = await userDomain.createUser(createUserInput);

	//register new authentication
	const authenticationRegisterInput = {
		userId: user._id.toString(),
		userStatus: user.status,
		personId: user.personId,
		provider: input.provider,
		providerToken: input.providerToken,
		groups: user.groups,
        roles: person.roles
	}
	await externalAuthenticationService.register(authenticationRegisterInput);

	logger.info(`User(${user._id}) Registered`);

	return userHelper.userToOutputObj(user);
}

async function invitedRegister(input){
	const schema = Joi.object({
		personId: Joi.string().required(),
		loginId: Joi.string().required(),
		password: Joi.string().required()
	});
	utility.validateInput(schema, input);

	const person = await personDomain.readPerson(input.personId);

	//check if person is already registered
	let existingUser;
	
	try{
		existingUser = await userDomain.readUserByPersonId(input.personId);
	}catch(error){
		if(error.name === customError.INTERNAL_SERVER_ERROR)
		throw error;
	}
	
	if (existingUser)
	throw { name: customError.BAD_REQUEST_ERROR, message: "Person already registered" };

	//create new user
	const createUserInput = {
		registrationTime: new Date(),
		activationKey: uuid.v4(),
		status: ACTIVE_STATUS,
		personId: input.personId
	}
	
	const user = await userDomain.createUser(createUserInput);

	//register new authentication
	const authenticationRegisterInput = {
		userId: user._id.toString(),
		userStatus: user.status,
		personId: user.personId,
		loginId: input.loginId,
		password: input.password,
		groups: user.groups,
        roles: person.roles
	}
	await externalAuthenticationService.register(authenticationRegisterInput);

	logger.info(`User(${user._id}) Registered`);

	return userHelper.userToOutputObj(user);
}

module.exports = {
	activate,
	adminActivate,
	deactivate,
	assignGroup,
	unassignGroup,
	deleteUser,
	resendActivationMessage,
	searchGroups,
	findUser,
	searchUsers,
	deleteAllUsers,
	sendRegistrationInvite,
	invitedSocialRegister,
	invitedRegister
}