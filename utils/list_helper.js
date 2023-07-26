var _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((acc, v) => acc + v.likes, 0)
}

const favoriteBlog = (blogs) => {
  let favoriteBlog = { likes: 0 }
  for(const blog of blogs) {
    if(blog.likes >= favoriteBlog.likes) {
      favoriteBlog = blog
    }
  }

  return {
    title: favoriteBlog.title,
    author: favoriteBlog.author,
    likes: favoriteBlog.likes
  }
}

const mostBlogs = (blogs) => {
  const authors = _.uniq(blogs.map(b => b.author))
  const authorCounts = authors.map(author => {
    return {
      author,
      blogs: blogs.reduce((acc, v) => {
        if(v.author == author) {
          return acc + 1
        }
        return acc
      }, 0)
    }
  })

  return _.maxBy(authorCounts, a => a.blogs)
}

const mostLikes = (blogs) => {
  const authors = _.uniq(blogs.map(b => b.author))
  const authorCounts = authors.map(author => {
    return {
      author,
      likes: blogs.reduce((acc, v) => {
        if(v.author == author) {
          return acc + v.likes
        }
        return acc
      }, 0)
    }
  })

  return _.maxBy(authorCounts, a => a.likes)  
}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}
