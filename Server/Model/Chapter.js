const mongoose = require('mongoose');
const chapterSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    status:{
        type: String
    },
    startDate:{
        type: Date
    },
    Dealine:{
        type: Date
    },
    completionDate:{
        type: Date
    },
    priority:{
        type: String
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true
    },
    chapterNumber:{
        type: String,
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth"
    },
    createdAt:{
        type: Date,
    },
    updatedAt:{
        type: Date,
    }
},
{timestamps: true}
)

const chapter = mongoose.model('chapter', chapterSchema);

module.exports = chapter