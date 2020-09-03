function deactivateUser(input){
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
                logger.error("Occupancy.findOne() error : ", err);
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
async function adminActivateUser(input) {
	var response = new Object();

	//TODO!!!!! set admin authentication

	if (input.userId == null || input.userId.length < 1) {
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	//get user
	var user;
	await User.findById(input.userId)
		.exec()
		.then(result => {
			user = result;
		})
		.catch(err => {
			logger.error("Error while running User.findById() : " + err);
			response.status = 500;
			response.message = "User.findById() is not available";
			throw response;
		});

	if(user == null){
		response.status = 400;
		response.message = "Invalid User ID";
		throw response;
	}
	
	//update user status
	user.status = ACTIVE_STATUS;
	user.lastUpdateTime = new Date();
	user.activationKey = null;
	user.save()
		.then(result => {
			logger.info("Successfully activated user : " + user.id);
		})
		.catch(err => {
			response.status = 400;
			response.message = "userModel.activateUser() is not available";
			throw response;
		});

	return {"status" : ACTIVE_STATUS};
}

async function assignGroup(input) {
	var response = new Object();
	
	//validate userId
	if (input.userId == null || input.userId.length == 0) {
		response.status = 400;
		response.message = "userId is mandatory";
		throw response;
	}

	var user;
	await User.findById(input.userId)
		.exec()
		.then(result => {
			user = result;
		})
		.catch(err => {
			logger.error("Error while running User.findById() : " + err);
			response.status = 500;
			response.message = "User.findById() is not available";
			throw response;
		});

	if (user == null) {
		response.status = 400;
		response.message = "invalid userId";
		throw response;
	}

	//validate groupId
	if (input.groupId == null || input.groupId.length == 0) {
		response.status = 400;
		response.message = "groupId is mandatory";
		throw response;
	}

	user.groups.push(input.groupId);

	await user.save()
		.then(() => {
			logger.info("Successfully updated groups for user : " + user.id);
		})
		.catch(err => {
			logger.error("Error while running user.save() : " + err);
			response.status = 500;
			response.message = "user.save() is not available";
			throw response;
		});

	return {"status":"SUCCESS"};
}

/**
 * By : Ken Lai
 * Date : Mar 15, 2020
 * 
 * find user by id or by accessToken, or provider with providerUserId
 */
async function findUser(input){
	var response = new Object();
	var userId;
	var user;

	if (input.provider != null) {
		//has provider, must user provideUserId
		if (input.providerUserId == null || input.providerUserId.length < 1) {
			response.status = 400;
			response.message = "providerUserId is mandatory";
			throw response;
		}
		
		//find user with provider and providerUserId
		await User.findOne({
			provider: input.provider,
			providerUserId: input.providerUserId
		})
			.exec()
			.then(result => {
				user = result;
			})
			.catch(err => {
				logger.error("Error while running User.find() : " + err);
				response.status = 500;
				response.message = "User.find() is not available";
				throw response;
			});

	} else {
		//no provider, must use userId or accessToken

		if ((input.userId == null || input.userId.length < 1) && (input.accessToken == null || input.accessToken.length < 1)) {
			response.status = 400;
			response.message = "must provide userId or accessToken";
			throw response;
		}

		if (input.userId != null) {
			userId = input.userId;
		} else {
			jwt.verify(input.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
				if (err) {
					logger.error("Error while running jwt.verify() : " + err);
					response.status = 500;
					response.message = "jwt.verify() is not available";
					throw response;
				}

				userId = user.id;
			});
		}

		await User.findById(userId)
			.exec()
			.then(result => {
				user = result;
			})
			.catch(err => {
				logger.error("Error while running User.findById() : " + err);
				response.status = 500;
				response.message = "User.findById() is not available";
				throw response;
			});
	}

	if (user == null) {
		response.status = 404;
		response.message = "No user found";
		throw response;
	}

	var outputObj
	outputObj = userToOutputObj(user);

	return outputObj;
}

/**
* By : Ken Lai
* Date : Mar 30, 2020
*
* fetch all users, paginated
* only callable for admin group
*/
async function fetchAllUsers() {
	var response = new Object();

	//TODO!!!! add paginateion
	//TODO!!!! add admin group authorization

	var users;
	await User.find()
		.then(result => {
			users = result;
		})
		.catch(err => {
			logger.error("Error while running User.find() : " + err);
			response.status = 500;
			response.message = "User.find() is not available";
			throw response;
		});

	var outputObjs = [];
	users.forEach(function (user, index) {
		var outputObj = userToOutputObj(user);
		outputObjs.push(outputObj);
	});

	return { "users" : outputObjs };
}