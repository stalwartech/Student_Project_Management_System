const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    status:{
        type: String
    },
    startDate:{
        type: Date
    },
    deadline:{
        type: Date
    },
    completionDate:{
        type: Date
    },
    chapter:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chapter',
        required: true
    },
    taskNumber:{
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
    },
    updatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth"
    }
},
{timestamps: true}
)

const task = mongoose.model('task', taskSchema);

module.exports = task