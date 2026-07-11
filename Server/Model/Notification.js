const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    sender:{
        type: Schema.Types.ObjectId,
        ref: "auth"
    },
    recipient:{
        type: Schema.Types.ObjectId,
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