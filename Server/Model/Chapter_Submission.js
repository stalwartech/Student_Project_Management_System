const mongoose = require("mongoose");
const chapterSubmissionSchema = new mongoose.Schema({
    chapter:{
        type: Schema.Types.ObjectId,
        ref: "chapter"
    },
    PDFFile:{
        type: String
    },
    version:{
        type: Number
    },
    submittedBy:{
        type: Schema.Type.ObjectId
    },
    submittedAt:{
        type: Date
    },
    status:{
        type: String
    }
},
{timestamps: true}
)

const chapterSubmission = mongoose.model('chapter_submission', chapterSubmissionSchema);

module.exports = chapterSubmission
