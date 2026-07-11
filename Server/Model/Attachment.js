const mongoose = require('mongoose');
const chapterSubmission = require('./Chapter_Submission');
const attachmentSchema = new mongoose.Schema({
    URL:{
        type: String,
    },
    size:{
        type: Number
    },
    uploadedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth"
    },
    uploadedAt:{
        type: Date,
    },
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "task"
    },
    chapterSubmission:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "chapter_submission"
    }
},
{timestamps: true}
)

const attachment = mongoose.model('attachment', attachmentSchema);

module.exports = attachment