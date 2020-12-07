class Profile{
    constructor(contact, picture){
        this.contact = contact;
        this.picture = picture;
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
    Profile,
    Contact,
    Picture
}