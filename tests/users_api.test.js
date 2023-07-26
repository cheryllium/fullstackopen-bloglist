const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const User = require('../models/user')

beforeEach(async () => {
  await User.deleteMany({})
  for(const user of helper.initialUsers) {
    let newUser = new User(user)
    await newUser.save()
  }
})

describe('when there are initial users', () => {
  test('correct number of users are returned as json', async () => {
    const response = await api
          .get('/api/users')
          .expect(200)
          .expect('Content-Type', /application\/json/)
    expect(response.body).toHaveLength(helper.initialUsers.length)
  })
})

describe('when creating new users', () => {
  test('creating new valid user works', async () => {
    const newUser = {
      username: "rexxi",
      name: "Rexxi",
      password: "dinotracks"
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(201)

    const users = await helper.usersInDb()
    expect(users.length).toBe(helper.initialUsers.length + 1)
  })
})

