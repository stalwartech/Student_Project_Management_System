const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    status:{
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
    },
    chatType:{
        type: String,
        enum: ["Private", "Project Group"]
    },
    attachment:{
        type: Schema.Types.ObjectId,
        ref: "attachment"
    }
},
{timeStamps: true}
);

const message = mongoose.model('message', messageSchema);

module.exports = message 
