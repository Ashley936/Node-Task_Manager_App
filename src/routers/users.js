const User = require('../models/user')
const auth = require('../middleware/auth')
const  { sendWelcomeMail,sendCancelationMail } = require('../email/account')
const multer = require('multer')
const sharp = require('sharp')
const express = require('express')
const router = new express.Router()
//USER SIGNUP
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    } catch (e) {
        res.status(400).send(e.message)
    }
})
//USER LOGIN
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})
//USER LOGOUT
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save();
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})
//LOGOUT ALL
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save();
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})
//GETTING USER PROFILE
router.get('/users/profile',auth, async (req, res) => {
    res.send(req.user)
})
//GETTING ALL USER PROFILES (TO BE DELETED)
router.get('/users',async (req, res) => {
    try {
        const result = await User.find({})
        if(result.length ===0)
            return res.status(404).send("NO USERS FOUND!!!!")
        res.send(result);
    } catch (e) {
        res.status(500).send(e.message)
    }
})

//EDIT USER
router.patch('/users/profile',auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if (!isValid) {
        return res.status(404).send({error: 'Some field is invalid'})
    }
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})
//UPLOAD PICS
const upload = multer({
    //dest:'images'
    limits: {
        fileSize: 3000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image!!'))
        }
        cb(undefined, true)
    }
})
router.post('/users/profile/pic', auth, upload.single('pic'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width:250,height:250 }).png().toBuffer()
    req.user.avatar = buffer //to read in img tag use"data:image/jpg;base64,<binary data>"
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})//error handling for upload middleware
})
//Delete pic
router.delete('/users/profile/pic', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send(req.user)
})
//To access img
router.get('/users/:id/pic', async (req, res) => {
    try {
        
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})
//DELETE USER 
router.delete('/users/profile',auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationMail(req.user.email, req.user.name)
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router