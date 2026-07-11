const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
    priority:{
        type: String,
    },
    createdat:{
        type: Date
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "auth"
    },
    project:{
        type: Schema.Types.ObjectId,
        ref: "project"
    },
    project_submission:{
        type: Schema.Types.ObjectId,
        ref: "project_submission"
    },
    status:{
        type: String
    },
    comment:{
        type: String
    },
    response:{
        type: String
    },
    responseAt:{
        type: Date
    },
    updatedAt:{
        type: Date
    },
    read:{
        type: Boolean
    },
    feedbackType:{
        type: String
    },
},
{timestamps: true}
)

const feedback = mongoose.model('feedback', feedbackSchema);

module.exports = feedback
