const mongoose = require('mongoose');
const authSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    gender: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    whatsapp: { 
        type: String, 
        required: true 
    },
    photo: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true 
    },
    matric: { 
        type: String, 
        required: true 
    },
    cgpa: { 
        type: String, 
        required: true 
    },
    level: { 
        type: String, 
        required: true 
    },
    staffId: { 
        type: String, 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
},
{timestamps: true}
)

const authModel = mongoose.model('auth', authSchema);

module.exports = authModel;
