const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = 5000 || process.env.PORT

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());



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

    await client.connect();
    const foodCollection = client.db('crave').collection('items')
    const userCollection = client.db('crave').collection('users')
    const orderFoodCollection = client.db('crave').collection('order')
    const addFoodCollection = client.db('crave').collection('addFood')


    // read data
    app.get('/foods', async(req, res) =>{
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // get data by id
    app.get('/foods/:id', async(req, res) =>{
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
    app.post('/order', async(req,res) =>{
      const addFood = req.body
      const result = await orderFoodCollection.insertOne(addFood)
      res.send(result)
    })

    app.get('/order', async(req, res)=>{
      let qurey ={}
      if(req.query?.email){
        qurey = {email: req.query.email}
      }
      const cursor = orderFoodCollection.find(qurey);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/orderupdate/:id', async(req,res) =>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await orderFoodCollection.findOne(query)
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