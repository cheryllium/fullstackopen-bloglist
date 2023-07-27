const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const User = require('../models/user')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

beforeEach(async () => {
  await User.deleteMany({})
  
  const saltRounds = 10
  for(const user of helper.initialUsers) {
    let newUser = new User({
      username: user.username,
      name: user.name,
      passwordHash: await bcrypt.hash(user.password, saltRounds)
    })
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
      username: 'rexxi',
      name: 'Rexxi',
      password: 'dinotracks'
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(201)

    const users = await helper.usersInDb()
    expect(users.length).toBe(helper.initialUsers.length + 1)
  })

  test('disallow non-unique username', async () => {
    const newUser = {
      username: 'steggi',
      name: 'Steggi 2',
      password: 'password'
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)

    expect(response.body.error).toContain('expected `username` to be unique')
  })

  test('disallow creating user without username', async () => {
    const newUser = {
      name: 'Steggi 2',
      password: 'password'
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)

    expect(response.body.error).toContain('must give both username and password')
  })

  test('disallow creating user without password', async () => {
    const newUser = {
      username: 'steggi',
      name: 'Steggi 2',
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)

    expect(response.body.error).toContain('must give both username and password')
  })

  test('username must be at least 3 characters long', async () => {
    const newUser = {
      username: 'st',
      name: 'Steggi 2',
      password: 'password'
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)

    expect(response.body.error).toContain('is shorter than the minimum allowed length (3)')
  })

  test('password must be at least 3 characters long', async () => {
    const newUser = {
      username: 'steggi',
      name: 'Steggi 2',
      password: 'ps'
    }

    const response = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)

    expect(response.body.error).toContain('password must be at least 3 characters long')
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
