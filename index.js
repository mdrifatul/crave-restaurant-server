const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express();
const port = 5000 || process.env.PORT

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
  // 'https://crave-67227.web.app',
  // 'https://crave-67227.firebaseapp.com'
],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())


// //middlewares for cookies
const logger = (req, res, next) =>{
  console.log('log: info', req.method, req.url)
  next();
}

const varifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('middleware cookies', token);
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized decoded'})
    }
    req.user = decoded
    next();
  });
  
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.80a5m0b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {

    // await client.connect();
    const foodCollection = client.db('crave').collection('items')
    const userCollection = client.db('crave').collection('users')
    const orderFoodCollection = client.db('crave').collection('order')
    const addFoodCollection = client.db('crave').collection('addFood')


    // auth related api
    app.post('/jwt',(req, res) =>{
      const user = req.body
      // console.log('user for token',user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true})
    }) 


    // read data
    app.get('/foods',async(req, res) =>{

      const page = Number(req.query.page)
      const limit = Number(req.query.limit)
      const skip = (page-1)* limit


      const cursor = foodCollection.find().skip(skip).limit(limit);
      // const cursor = foodCollection.find()
      const result = await cursor.toArray();

      const total = await foodCollection.countDocuments()
      res.send(
        {total, result}
      )
    })

    // get data by id
    app.get('/foods/:id',async(req, res) =>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.findOne(query)
      res.send(result)
    })

  

    app.post('/users', async(req, res) =>{
      const newUser = req.body
      const result = await userCollection.insertOne(newUser)
      res.send(result)
    })

    // order food
    app.post('/order',logger, varifyToken,async(req,res) =>{
      const addFood = req.body
      const result = await orderFoodCollection.insertOne(addFood)
      res.send(result)
    })

    app.get('/order',logger, varifyToken, async(req, res)=>{
      let qurey ={}
      if(req.query?.email){
        qurey = {email: req.query.email}
      }
      const cursor = orderFoodCollection.find(qurey);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/addfoodUpdate/:id',async(req,res) =>{
      const id = req.params.id
      // console.log(id);
      const query = {_id: new ObjectId(id)}
      const result = await addFoodCollection.findOne(query)
      console.log({result});
      res.send(result)
    })

    app.patch('/updateaddFood/:id',async(req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const updateFood = req.body;
      const food = {
        $set: {
          name:updateFood.name,
          email:updateFood.email,
          price:updateFood.price, 
          username:updateFood.username, 
          quantity:updateFood.quantity, 
          date:updateFood.date,
          image:updateFood.image,
        },
      }
      const result = await addFoodCollection.updateOne(filter,food,options)
      console.log(result);
      res.send(result)
    })
      
    app.delete('/order/:id', async(req, res) =>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await orderFoodCollection.deleteOne(query)
      res.send(result)
    })

    // add food
    app.get('/addFood', async(req,res)=>{
      const cursor = addFoodCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.post('/addFood', async(req, res) =>{
      const orderFood = req.body
      const result = await addFoodCollection.insertOne(orderFood)
      res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=>{
  res.send('crave serve in running')
})
app.listen(port, () =>{
  console.log(`crave server in running on port : ${port}`);
})