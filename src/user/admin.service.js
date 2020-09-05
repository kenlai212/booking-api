function deactivateUser(input, user){
	return new Promise(async (resolve, reject) => {
		//validate user group rights
		const rightsGroup = [
			"USER_ADMIN_GROUP"
		]

		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });
		}

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
        
        //find targetUser
        User.findById(input.userId)
            .then(user => {
                if(user == null){
                    reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" });
                }

                //update user status to db
                user.status = INACTIVE_STATUS;
                user.lastUpdateTime = new Date();

                const historyItem = {
                    transactionTime: common.getNowUTCTimeStamp(),
                    transactionDescription: "User Deactived"
                }
                user.history.push(historyItem);

                return user.save()
            })
            .then(user => {
                resolve(user);
            })
            .catch(err => {
                logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
            });
    });
}

/*
* By : Ken Lai
* Date : Mar 31, 2020

* adminstartive active user. No activation email necessary
* only callable by admin
*/
function adminActivateUser(input, user) {
	return new Promise(async (resolve, reject) => {
		//validate user group rights
		const rightsGroup = [
			"USER_ADMIN_GROUP"
		]

		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });

		}
		
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

		//get user
		User.findById(input.userId)
			.then(user => {
				if (user == null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" });
				}

				//update user status
				user.status = ACTIVE_STATUS;
				user.lastUpdateTime = new Date();
				user.activationKey = null;

				return user;
			})
			.then(user => {
				resolve(user.save());
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function assignGroup(input, user) {
	return new Promise(async (resolve, reject) => {
		//validate user group rights
		const rightsGroup = [
			"USER_ADMIN_GROUP"
		]

		if (userAuthorization(user.groups, rightsGroup) == false) {
			reject({ name: customError.UNAUTHORIZED_ERROR, message: "Insufficient Rights" });

		}

		//validate input data
		const schema = Joi.object({
			userId: Joi
				.string()
				.required(),
			groupId: Joi
				.string()
				.validate("BOOKING_ADMIN_GROUP","USER_ADMIN_GROUP")
				.required()
			//TODO add more valid groups
		});

		const result = schema.validate(input);
		if (result.error) {
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		User.findById(input.userId)
			.then(user => {
				if (user == null) {
					reject({ name: customError.BAD_REQUEST_ERROR, message: "Invalid userId" });
				}

				user.groups.push(input.groupId);

				return user;
			})
			.then(user => {
				resolve(user.save())s;
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

function socialUser(input) {
	return new Promise(async (resolve, reject) => {
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
			reject({ name: customError.BAD_REQUEST_ERROR, message: result.error.details[0].message.replace(/\"/g, '') });
		}

		//find user with provider and providerUserId
		User.findOne({
			provider: input.provider,
			providerUserId: input.providerUserId
		})
			.then(user => {
				if (user == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND, message: "No user found" });
				}

				var outputObj
				outputObj = userToOutputObj(user);

				resolve(outputObj);
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
 * By : Ken Lai
 * Date : Mar 15, 2020
 * 
 * find user by id or by accessToken, or provider with providerUserId
 */
function findUser(input) {
	return new Promise(async (resolve, reject) => {
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

		User.findById(userId)
			.then(user => {
				if (user == null) {
					reject({ name: customError.RESOURCE_NOT_FOUND, message: "No user found" });
				}

				var outputObj
				outputObj = userToOutputObj(user);

				resolve(outputObj);
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}

/**
* By : Ken Lai
* Date : Mar 30, 2020
*
* fetch all users, paginated
* only callable for admin group
*/
function searchUsers() {
	return new Promise(async (resolve, reject) => {
		//TODO!!!! add paginateion
		//TODO!!!! add admin group authorization

		User.find()
			.then(users => {
				var outputObjs = [];
				users.forEach(function (user, index) {
					var outputObj = userToOutputObj(user);
					outputObjs.push(outputObj);
				});

				resolve({ "users": outputObjs });
			})
			.catch(err => {
				logger.error("Internal Server Error : ", err);
				reject({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });
			});
	});
}