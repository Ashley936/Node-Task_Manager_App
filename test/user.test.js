const app = require('../src/app')
const User = require('../src/models/user')
const request = require('supertest')


const userOne = {
    name: "Mike",
    email: "mike@example.com",
    password:'12345asd'
}
beforeEach(async () => {
    await User.deleteMany()
    await new User(userOne).save()
})

test('Should sign up a new user', async () => {
    await request(app).post('/users').send({
        name: "Dave",
        age: 18,
        email: "rastogimwn@gmail.com",
        password:'12345asd'
    }).expect(201)
})

test('Login userOne', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)
})

test('Login fail with wrong credentials', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: "wrongpassword"
    }).expect(400)
})