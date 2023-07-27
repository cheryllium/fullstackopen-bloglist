const config = require('./utils/config')
require('express-async-errors')
const express = require('express')
const middleware = require('./utils/middleware')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

const Blog = require('./models/blog')

const mongoUrl = process.env.NODE_ENV === 'test'
      ? config.TEST_MONGODB_URI : config.MONGODB_URI
mongoose.connect(mongoUrl)

app.use(cors())
app.use(express.json())

const blogsRouter = require('./controllers/blog')
app.use('/api/blogs', middleware.userExtractor, blogsRouter)

const usersRouter = require('./controllers/users')
app.use('/api/users', usersRouter)

const loginRouter = require('./controllers/login')
app.use('/api/login', loginRouter)

app.use(middleware.errorHandler)

module.exports = app
