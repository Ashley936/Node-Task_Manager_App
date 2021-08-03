const Task = require('../models/task')
const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()

//posting new users and tasks
router.post('/tasks',auth, async(req, res) => {
    try {
        //const newTask = new Task(req.body)
        const task = new Task({...req.body, owner: req.user._id})
        const result = await task.save()
        res.status(201).send(result)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

//Listing users and tasks
//GET ?completed=true
//GET ?limit=10&skip=20
//GET ?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.sortBy) {
        const part = req.query.sortBy.split(':')
        sort[part[0]] = part[1]==='desc'? -1:1
    }
    if (req.query.completed) {
        match.isCompleted = req.query.completed === 'true'
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send(e.message)
    }
})
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const result = await Task.findOne({_id, owner:req.user._id})
        if(!result)
            return res.status(404).send("NO MATCH FOUND!!!!")
        res.send(result);
    } catch (e) {
        res.status(500).send(e.message)
    }
})

//Updating tasks
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['task','isCompleted']
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if (!isValid) {
        return res.status(404).send({error: 'Some field is invalid'})
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send('No task found')
        }
        updates.forEach((update) => task[update]=req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

//DELETE TASK
router.delete('/tasks/:id',auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id:req.params.id, owner: req.user._id})
        if (!task) {
            return res.status(404).send({ error:"no such task found!"})
        }
        res.send(task)
    } catch (e) {
        res.status(500).send("invalid id")
    }
})

module.exports = router