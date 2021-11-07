const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.edakp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function run(){
 try{
    await client.connect();
    const database = client.db("Doctor-portal");
    const appointmentCollection = database.collection("appointments");
    const usersCollection = database.collection("users");

    //post 

    app.post('/appointments',async(req,res)=>{
      const appointment=req.body;
      const result = await appointmentCollection.insertOne(appointment);
      res.json(result);
    })

    //Register user set in database

    app.post('/users',async(req,res)=>{
      const user=req.body;
      const result=await usersCollection.insertOne(user);
      res.json(result);
    })

    //GoogleSignin user save in database in upsert

    //Put use to update 
    app.put('/users',async(req,res)=>{
      const user=req.body;
      const filter = {email:user.email };
      const options = { upsert: true };
      const updateDoc={$set:user};
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    })

    app.put('/users/admin',async(req,res)=>{
      const user= req.body;
      const filter={email:user.email}
      const updateDoc={$set:{role:'admin'}};
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
      
    })


    //Get
    app.get('/appointments',async(req,res)=>{
      const email=req.query.email;
      const date=new Date(req.query.date).toLocaleDateString();
      const query={email:email, date:date}
      const cursor=appointmentCollection.find(query);
      const appointments= await cursor.toArray();
      res.json(appointments);
    })

 }

finally{
    // await client.close();
}
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})