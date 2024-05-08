const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://mcao4003:${password}@cluster0.amtoo9r.mongodb.net/testbloglist?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url).then(()=>{
    const blogSchema = new mongoose.Schema({
        title: String,
        author: String,
        url: String,
        likes: Number
    })

    blogSchema.set('toJSON', {
        transform: (document, returnedObject) => {
            returnedObject.id = returnedObject._id.toString()
            delete returnedObject._id
            delete returnedObject.__v
        }
    })

    const Blog = mongoose.model('Blog', blogSchema)
    const blog = new Blog({
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
        likes: 1,
      })
      
    blog.save().then(result=>{
        console.log(result)
        mongoose.connection.close()
    })

})
   