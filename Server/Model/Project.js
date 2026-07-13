const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true
    },
    description: { 
        type: String,
        required: true
    },
    deadline:{
        type: Date,
        required: true
    },
    startDate:{
        type: Date,
        required: true
    },
    supervisor:{
        type: Schema.Types.ObjectId,
        ref: 'auth',
        required: true
    },
    student:{
        type: Schema.Types.ObjectId,
        ref: 'auth',
        required: true          
    },
    projectType:{
        type: String,
    },
    projectCode:{
        type: String,
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'auth',
    },
    createdOn:{
        type: Date,
    },
    updatedBy:{
        type: Schema.Types.ObjectId,
        ref: 'auth',
    },
    updatedOn:{
        type: Date,
    },
    approvalStatus:{
        type: String,
    },
    department:{
        type: String,
    },
    AcademicSession:{
        type: String,
        required: true
    },
    projectLeader:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth",
    },
    updatedAt:{
        type: Date
    },
    isLocked:{
        type: String,
        enum: [true, false]
    }

})

const projectModel = mongoose.model('project', projectSchema);

module.exports = projectModel;