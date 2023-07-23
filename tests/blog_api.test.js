const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  for(const blog of helper.initialBlogs) {
    let newBlog = new Blog(blog)
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
    const newPost = {
      title: "Foo bar",
      author: "Robert C. Martin",
      url: "http://example.com",
      likes: 0
    }

    const response = await api
          .post('/api/blogs')
          .send(newPost)
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
    const newPost = {
      title: "Foo bar",
      author: "Robert C. Martin",
      url: "http://example.com",
    }
    const response = await api
          .post('/api/blogs')
          .send(newPost)
          .expect(201)

    const blogs = await helper.blogsInDb()
    const blog = blogs.find(b => b.id === response.body.id)

    expect(blog.likes).toBe(0)
  })

  test('if title or url are missing, responds with 400', async () => {
    const newPost = {
      author: "Robert C. Martin",
    }

    // Both are missing
    await api
      .post('/api/blogs')
      .send(newPost)
      .expect(400)

    // Only title is missing
    await api
      .post('/api/blogs')
      .send({ ...newPost, url: "http://example.com" })
      .expect(400)

    // Only url is missing
    await api
      .post('/api/blogs')
      .send({ ...newPost, title: "Foo bar" })
      .expect(400)
  })
})

describe('deleting a blog post', () => {
  test('can delete a blog post', async () => {
    const blogs = await helper.blogsInDb()
    const blogToDelete = blogs[0]
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const updatedBlogs = await helper.blogsInDb()
    const blogIds = updatedBlogs.map(b => b.id)
    expect(blogIds).not.toContain(blogToDelete.id)
  })

  test('returns 204 when deleting nonexistent id', async () => {
    const nonExistingId = await helper.nonExistingId()
    await api
      .delete(`/api/blogs/${nonExistingId}`)
      .expect(204)
  })
  
  test('returns 400 with error when deleting malformed id', async () => {
    const response = await api
          .delete('/api/blogs/1')
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

afterAll(async () => {
  await mongoose.connection.close()
})
