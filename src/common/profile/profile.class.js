class PersonalInfo{
    constructor(name, dob, gender){
        this.name = name;
        this.dob = dob;
        this.gender = gender;
    }
}

class Contact{
    constructor(telephoneCountryCode, telephoneNumber, emailAddress){
        this.telephoneCountryCode = telephoneCountryCode;
        this.telephoneNumber = telephoneNumber;
        this.emailAddress = emailAddress;
    }
}

class Picture{
    constructor(url){
        this.url = url
    }
}

module.exports = {
    PersonalInfo,
    Contact,
    Picture
}