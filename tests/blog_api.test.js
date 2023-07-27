const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

beforeEach(async () => {
  // Populate users
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

  // Populate blogs

  const users = await User.find({})
  const firstUser = users[0]
  
  await Blog.deleteMany({})
  for(const blog of helper.initialBlogs) {
    let newBlog = new Blog({
      ...blog,
      user: firstUser._id
    })
    await newBlog.save()
  }
})

describe('when there are initial blog posts', () => {
  test('correct number of blogs are returned as json', async () => {
    const response = await api
          .get('/api/blogs')
          .expect(200)
          .expect('Content-Type', /application\/json/)
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('unique identifier of blog posts is named id', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined()
  })
})

describe('creating a new blog post', () => {
  test('can create new blog post', async () => {
    // Log in
    const loginResponse = await api
          .post('/api/login')
          .send({
            'username': helper.initialUsers[0].username,
            'password': helper.initialUsers[0].password
          })
    const token = loginResponse.body.token
    
    // Create new blog post
    const newPost = {
      title: "Foo bar",
      author: "Robert C. Martin",
      url: "http://example.com",
      likes: 0
    }

    const response = await api
          .post('/api/blogs')
          .send(newPost)
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

    const blogs = await helper.blogsInDb()
    expect(blogs.length).toBe(helper.initialBlogs.length + 1)

    const blog = blogs.find(b => b.id == response.body.id)
    expect(blog.title).toBe(newPost.title)
    expect(blog.author).toBe(newPost.author)
    expect(blog.url).toBe(newPost.url)
    expect(blog.likes).toBe(newPost.likes)
  })

  test('if likes property is missing, it defaults to 0', async () => {
    // Log in
    const loginResponse = await api
          .post('/api/login')
          .send({
            'username': helper.initialUsers[0].username,
            'password': helper.initialUsers[0].password
          })
    const token = loginResponse.body.token

    // Create new post
    const newPost = {
      title: "Foo bar",
      author: "Robert C. Martin",
      url: "http://example.com",
    }
    const response = await api
          .post('/api/blogs')
          .send(newPost)
          .set('Authorization', `Bearer ${token}`)
          .expect(201)

    const blogs = await helper.blogsInDb()
    const blog = blogs.find(b => b.id === response.body.id)

    expect(blog.likes).toBe(0)
  })

  test('if title or url are missing, responds with 400', async () => {
    // Log in
    const loginResponse = await api
          .post('/api/login')
          .send({
            'username': helper.initialUsers[0].username,
            'password': helper.initialUsers[0].password
          })
    const token = loginResponse.body.token
    
    const newPost = {
      author: "Robert C. Martin",
    }

    // Both are missing
    await api
      .post('/api/blogs')
      .send(newPost)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    // Only title is missing
    await api
      .post('/api/blogs')
      .send({ ...newPost, url: "http://example.com" })
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    // Only url is missing
    await api
      .post('/api/blogs')
      .send({ ...newPost, title: "Foo bar" })
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })
})

describe('deleting a blog post', () => {
  test('can delete a blog post', async () => {
    // Log in
    const loginResponse = await api
          .post('/api/login')
          .send({
            'username': helper.initialUsers[0].username,
            'password': helper.initialUsers[0].password
          })
    const token = loginResponse.body.token
    
    const blogs = await helper.blogsInDb()
    const blogToDelete = blogs[0]
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const updatedBlogs = await helper.blogsInDb()
    const blogIds = updatedBlogs.map(b => b.id)
    expect(blogIds).not.toContain(blogToDelete.id)
  })

  test('returns 204 when deleting nonexistent id', async () => {
    // Log in
    const loginResponse = await api
          .post('/api/login')
          .send({
            'username': helper.initialUsers[0].username,
            'password': helper.initialUsers[0].password
          })
    const token = loginResponse.body.token

    const nonExistingId = await helper.nonExistingId()
    await api
      .delete(`/api/blogs/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)
  })
  
  test('returns 400 with error when deleting malformed id', async () => {
    // Log in
    const loginResponse = await api
          .post('/api/login')
          .send({
            'username': helper.initialUsers[0].username,
            'password': helper.initialUsers[0].password
          })
    const token = loginResponse.body.token

    const response = await api
          .delete('/api/blogs/1')
          .set('Authorization', `Bearer ${token}`)
          .expect(400)
    expect(response.body.error).toBe('malformatted id')
  })
})

describe('can update a blog post', () => {
  test('can update likes on a blog post', async () => {
    const blogs = await helper.blogsInDb()
    const blogToUpdate = blogs[0]

    const newContent = {
      ...blogToUpdate, likes: 15
    }
    delete newContent.id

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(newContent)

    const updatedBlogs = await helper.blogsInDb()
    const updatedBlog = updatedBlogs.find(b => b.id === blogToUpdate.id)

    expect(updatedBlog.likes).toBe(15)
  })
})

// user tests

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
