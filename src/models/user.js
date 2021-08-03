const validator = require('validator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "You have no name?"],
        trim: true
    },
    email: {
        type: String,
        unique:true,
        required: [true, 'email is required for obvious reasons'],
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid!!!")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: [7, 'Min length is 7 characters'],
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error("Invalid password!!")
            }
        }
    },
    age: {
        type: Number,
        default: 18,
        trim: true,
        validate(value) {
            if (value <= 0) {
                throw new Error("Age should be positive!!!")
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required:true
        }
    }],
},{
    timestamps:true
})
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField:'owner'
})
//below fuction get called automatically evertime we call res.send
userSchema.methods.toJSON = function () {
    const user = this
    const userObj = user.toObject();
    delete userObj.tokens
    delete userObj.password
    delete userObj.avatar
    return userObj
}
userSchema.methods.generateAuthToken = async function () {
    const user =this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_TOKEN)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token;
}
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Unable to login!')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Unable to login')
    }
    return user;
}
userSchema.pre('save', async function (next) {
    const user =this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})
//delete tasks after user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})
const User = mongoose.model('User', userSchema)
module.exports = User