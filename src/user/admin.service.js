async function deactivateUser(input, user){
	//validate user group rights
	const rightsGroup = [
		"USER_ADMIN_GROUP"
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };
	}

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find targetUser
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Insufficient Rights" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//update user status to db
	targetUser.status = INACTIVE_STATUS;
	targetUser.lastUpdateTime = new Date();

	const historyItem = {
		transactionTime: common.getNowUTCTimeStamp(),
		transactionDescription: "User Deactived"
	}
	targetUser.history.push(historyItem);

	try {
		return await targetUser.save();
	} catch (err) {
		logger.error("user.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

/*
* By : Ken Lai
* Date : Mar 31, 2020

* adminstartive active user. No activation email necessary
* only callable by admin
*/
async function adminActivateUser(input, user) {
	//validate user group rights
	const rightsGroup = [
		"USER_ADMIN_GROUP"
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };

	}

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//get target user
	let targetUser;
	try {
		targetUser = await User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Insufficient Rights" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//update user status
	targetUser.status = ACTIVE_STATUS;
	targetUser.lastUpdateTime = new Date();
	targetUser.activationKey = null;

	try {
		return targetUser.save();
	} catch (err) {
		logger.error("user.save() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}
}

async function assignGroup(input, user) {
	//validate user group rights
	const rightsGroup = [
		"USER_ADMIN_GROUP"
	]

	if (userAuthorization(user.groups, rightsGroup) == false) {
		throw { name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" };

	}

	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required(),
		groupId: Joi
			.string()
			.validate("BOOKING_ADMIN_GROUP", "USER_ADMIN_GROUP")
			.required()
		//TODO add more valid groups
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	let targetUser;
	try {
		targetUser = User.findById(input.userId);
	} catch (err) {
		logger.error("User.findById Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (targetUser == null) {
		throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" };
	}

	//add groupId to target.groups
	targetUser.groups.push(input.groupId);

	try {
		return await user.save();
	} catch (err) {
		logger.error("Internal Server Error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
    }
}

async function findSocialUser(input) {
	//validate input data
	const schema = Joi.object({
		provider: Joi
			.string()
			.required(),
		providerUserId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		throw { name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') };
	}

	//find user with provider and providerUserId
	let user;
	try {
	user = await User.findOne({
			provider: input.provider,
			providerUserId: input.providerUserId
		})
	} catch (err) {
		logger.error("User.findOne() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		throw { name: customError.RESOURCE_NOT_FOUND, message: "No user found" };
	}

	return userToOutputObj(user);
}

/**
 * By : Ken Lai
 * Date : Mar 15, 2020
 * 
 * find user by id or by accessToken, or provider with providerUserId
 */
async function findUser(input) {
	//validate input data
	const schema = Joi.object({
		userId: Joi
			.string()
			.required()
	});

	const result = schema.validate(input);
	if (result.error) {
		reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
	}

	let user;
	try {
		user = await User.findById(userId);
	} catch (err) {
		logger.error("User.findById() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	if (user == null) {
		reject({ name: customError.RESOURCE_NOT_FOUND, message: "No user found" });
	}

	return userToOutputObj(user);
}

/**
* By : Ken Lai
* Date : Mar 30, 2020
*
* fetch all users, paginated
* only callable for admin group
*/
async function searchUsers() {
	//TODO!!!! add paginateion
	//TODO!!!! add admin group authorization

	let users;
	try {
		users = await User.find();
	} catch (err) {
		logger.error("User.find() error : ", err);
		throw { name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" };
	}

	let outputObjs = [];
	users.forEach(function (user, index) {
		var outputObj = userToOutputObj(user);
		outputObjs.push(outputObj);
	});

	return outputObjs;
}