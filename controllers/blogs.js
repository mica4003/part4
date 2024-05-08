const jwt = require('jsonwebtoken')
const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogRouter.get('/', async(request, response, next) => {
  try{
    const savedBlogs = await Blog
      .find({}).populate('user',{username:1, name:1})
    response.json(savedBlogs)
  }catch{
    error => next(error)
  }
})

blogRouter.post('/', async(request, response, next) => {
	const {title, author, url, likes} = request.body
  
  if( !title || !url) {
    response.status(400).json({error:'Title and url are required'})
  }

  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if(!decodedToken.id){
    response.status(401).json({ error: 'Invalid Token'})
  }

  const user = await User.findById(decodedToken.id)
  
  const blog = new Blog({
    title ,
    author,
    url,
    likes: likes || 0,
    user: user.id
  })

  try{
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    
    response.status(201).json(savedBlog)
  }catch{
    error => next(error)
  }
})

blogRouter.delete('/:id', async(request, response, next) => {
  const blogId = request.params.id

  try{
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if(!decodedToken.id){
      response.status(401).json({ error: 'Invalid Token'})
    }

    const blog = await Blog.findById(blogId)
    if(!blog){
      return response.status(404).json({error: 'Blog not found'})
    }
    if(blog.user.toString() !== decodedToken.id ){
      return response.status(403).json({error: 'Unauthorized user'})
    }

    await Blog.findByIdAndDelete(blogId)
    response.status(204).end()
  }catch{
    error => next(error)
  }
})

blogRouter.put('/:id', async(request, response, next) => {
  const {title, author, url, likes} = request.body

  const blog = {
    title,
    author,
    url, 
    likes
  }
  
  try{
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, note, {new: true})
    response.json(updatedBlog)
  }catch{
    error => next(error)
  }
})

module.exports = blogRouter