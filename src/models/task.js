const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    task: {
        type: String,
        required: true,
        trim: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
        enum: {
            values: [true, false],
            message: '{VALUE} is not supported'
        }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'User'
    }
}, {
    timestamps:true
})

const Task = mongoose.model('Task', taskSchema)
module.exports = Task