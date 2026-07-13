const mongoose = require('mongoose');
const OTPSchema = new mongoose.Schema({
    User: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    purpose:{
        type: String,
    },
    expiresAt: {
        type: Date,
        required: true
    },
    verified:{
        type: Boolean,
        default: false
    }
},
{timestamps: true}
)

// To be used for account activation , forgot password, email verification, changing email 

const OTPModel = mongoose.model('otp', OTPSchema);

module.exports = OTPModel