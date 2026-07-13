const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth"
    },
    recipient:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth"
    },
    title:{
        type: String
    },
    message:{
        type: String
    },
    isRead:{
        type: Boolean
    },
    readAt:{
        type: Date
    }
},
{timestamps: true}
)

const notification = mongoose.model('notification', notificationSchema);

module.exports = notification