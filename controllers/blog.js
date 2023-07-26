const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  if(!request.body.title || !request.body.url) {
    return response.status(400).end()
  }

  const users = await User.find({})
  const user = users[0]
  
  const blog = request.body.likes
        ? new Blog({ ...request.body, user: user.id })
        : new Blog({ ...request.body, likes: 0, user: user.id })

  const result = await blog.save()

  user.blogs = user.blogs.concat(result._id)
  await user.save()
  
  response.status(201).json(result)
})

blogsRouter.put('/:id', async (request, response) => {
  const { title, author, url, likes } = request.body
  const blog = {
    title, author, url, likes
  }
  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    blog,
    { new: true, runValidators: true, context: 'query' }
  )
  response.json(updatedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

module.exports = blogsRouter
