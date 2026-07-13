const mongoose = require('mongoose');
const supervisorLimitSchema = new mongoose.Schema({
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supervisor',
        required: true
    },
    limit: {
        type: Number,
        required: true
    }
});

const SupervisorLimit = mongoose.model('SupervisorLimit', supervisorLimitSchema);

module.exports = SupervisorLimit;