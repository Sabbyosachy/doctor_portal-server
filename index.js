const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
require('dotenv').config();
const ObjectId=require('mongodb').ObjectId;
const fileUpload=require('express-fileupload');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.edakp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(uri);
const app = express()
const port = process.env.PORT || 5000;


const serviceAccount = require ('./doctorsportal-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());
app.use(fileUpload());

async function verifyToken(req,res,next){
  if(req.headers?.authorization?.startsWith('Bearer')){
    const Token=req.headers.authorization.split(' ')[1];

   
  try{
   const decodedUser=await admin.auth().verifyIdToken(Token);
   req.decodedEmail=decodedUser.email;

  }
  catch{

  }




  }

  next();
}


// doctorsportal-adminsdk.json
async function run(){
 try{
    await client.connect();
    const database = client.db("Doctor-portal");
    const appointmentCollection = database.collection("appointments");
    const usersCollection = database.collection("users");
    const doctorsCollection = database.collection("doctors");

    //post 

    app.post('/appointments',async(req,res)=>{
      const appointment=req.body;
      const result = await appointmentCollection.insertOne(appointment);
      res.json(result);
    })

    //get doctor

    app.get('/doctors',async(req,res)=>{
      const cursor =doctorsCollection.find({});
      const doctors=await cursor.toArray();
      res.json(doctors);
    })

    //doctors post 
    app.post('/doctors',async(req,res)=>{
     const name=req.body.name;
     const email=req.body.email;
     const pic=req.files.image;
     const picData=pic.data;
     const encodedData=picData.toString('base64');
     const imageBuffer=Buffer.from(encodedData,'base64');
     const doctor={
       name,
       email,
       image:imageBuffer,
     }
     const result=await doctorsCollection.insertOne(doctor);
     res.json(result);

    })
    
    app.get('/appointments/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:ObjectId(id)};
      const result=await appointmentCollection.findOne(query);
      res.json(result);

    })

    //Put appointmnet
    app.put('/appointments/:id',async(req,res)=>{
      const id=req.params.id;
      const payment=req.body;
      const filter={_id:ObjectId(id)};
      const updateDoc = {
        $set: {
          payment:payment
        },
      };
       
      const result=await appointmentCollection.updateOne(filter,updateDoc);
      res.json(result);
    })

   
    //Payment post
    app.post('/create-payment-intent',async(req,res)=>{
    const paymentinfo=req.body;
    const amount=paymentinfo.price*100;
    const paymentIntent = await stripe.paymentIntents.create({
      amount:amount,
      currency: "usd",
      payment_method_types:['card']
     
    });
    res.json({clientSecret: paymentIntent.client_secret})

    })
   

    //admin 

    app.get('/users/:email',async(req,res)=>{
      const email=req.params.email;
      const query={email:email};
      const user=await usersCollection.findOne(query);
      let isAdmin =false;
      if(user?.role==='admin'){
          isAdmin=true;
      }
      res.json({admin:isAdmin})

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

    app.put('/users/admin',verifyToken,async(req,res)=>{
      const user= req.body;
      const requester=req.decodedEmail;
      if(requester){
        const requestAcc=await usersCollection.findOne({email:requester});
        if(requestAcc.role==='admin'){
          const filter={email:user.email}
          const updateDoc={$set:{role:'admin'}};
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      }
      else{
        res.status(403).json({message:'you are not able to be admin'})
      }
      
      
    })


    //Get
    app.get('/appointments',verifyToken,async(req,res)=>{
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