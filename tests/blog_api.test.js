const {test, beforeEach, after, describe} = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
})

test('blogs are returned as json', async()=> {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('unique identifier property of the blog posts is named id', async () => {
    const response = await api.get('/api/blogs')
    response.body.forEach(blog=> {
        assert.ok(blog.id)
        assert.strictEqual(blog._id, undefined)
    })    
})

test('Blog can be saved', async()=>{
    const newBlog = {
        title: "First class tests",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
        likes: 10,
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
    
    const response = await api.get('/api/blogs')
    const titles = response.body.map(r => r.title)

    assert.strictEqual( response.body.length, helper.initialBlogs.length + 1 )
    assert(titles.includes('First class tests'))
})

test('if the likes property is missing from the request, it will default to the value 0', async()=>{
    const newBlog = {
        title: "Blog without likes",
        author: "Test Author",
        url: "http://example.com/blog",
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
    
    const response = await api.get('/api/blogs')
    const createdBlog = response.body.find(blog => blog.title === "Blog without likes")

    assert.strictEqual(createdBlog.likes, 0)
})

test('Responds with 400 Bad Request if title is missing', async () => {
    const newBlog = {
        author: "Test Author",
        url: "http://example.com/blog",
        likes: 10
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
})

test('Responds with 400 Bad Request if url is missing', async () => {
    const newBlog = {
        title: "Test Blog",
        author: "Test Author",
        likes: 10
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
})

test('likes of blog can be updated', async() => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const updatedLikes = blogToUpdate.likes + 1

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send({ likes: updatedLikes})
    
     const updatedBlog = await Blog.findById(blogToUpdate.id)
     assert.strictEqual(updatedBlog.likes, updatedLikes)
})


describe('deletion of a note', () => {
    test('succeeds with status code 204 if id is valid', async() => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)

        const titles = blogsAtEnd.map(blog => blog.title)
        assert(!titles.includes(blogToDelete.title))
    })
})

after(async ()=>{
   await mongoose.connection.close()
})