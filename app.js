const config = require('./utils/config')
require('express-async-errors')
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

const Blog = require('./models/blog')

const mongoUrl = config.MONGODB_URI
mongoose.connect(mongoUrl)

app.use(cors())
app.use(express.json())

const blogsRouter = require('./controllers/blog')
app.use('/api/blogs', blogsRouter)

module.exports = app
