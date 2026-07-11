const mongoose = require('mongoose');
const meetingSchema = new mongoose.Schema({
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    meetingURL:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    startedAt:{
        type: Date
    },
    endedAt:{
        type: Date
    },
    status:{
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled' 
    },
    duration:{
        type: Number,
        default: 0
    }
},
{timestamps: true}
)

const meeting = mongoose.model('Meeting', meetingSchema);
module.exports = meeting;