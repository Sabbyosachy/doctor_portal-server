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

    //post 

    app.post('/appointments',async(req,res)=>{
      const appointment=req.body;
      const result = await appointmentCollection.insertOne(appointment);
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