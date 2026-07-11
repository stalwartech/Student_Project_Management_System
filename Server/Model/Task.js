const 
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
        type: Schema.Types.ObjectId,
        ref: 'chapter',
        required: true
    },
    taskNumber:{
        type: String,
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "auth"
    },
    createdAt:{
        type: Date,
    },
    updatedAt:{
        type: Date,
    },
    updatedBy:{
        type: Schema.Types.ObjectId,
        ref: "auth"
    }
},
{timestamps: true}
)

const task = mongoose.model('task', taskSchema);

module.exports = task