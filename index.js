const express = require('express');
const { MongoClient, Admin } = require('mongodb');
var admin = require("firebase-admin");
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//firebase admin initialization 

var serviceAccount = require("./ema-jhon-simple-restart-firebase-adminsdk-ftitg-e90d82dbb1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//middelware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.acq7h.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run(){
    try{
        await client.connect();
        const database = client.db('online_shop');
        const productCollection = database.collection('products');
        const orderColection = database.collection('orders');

        //get api

        app.get('/products', async(req, res)=>{
            const cursor = productCollection.find({})
            const page = req.query.page;
            console.log(page)
            const size = parseInt(req.query.size);
            let products;
            const count = await cursor.count();
            if(page){
                products = await cursor.skip(page*size).limit(size).toArray()
            }
            else{
                products = await cursor.toArray()
            }
            
            res.send({
                count,
                products
            })
        });

        //post api

        app.post('/products/bykey', async(req, res)=>{
            const keys = req.body;
            const query = {key:{$in:keys}}
            const products = await productCollection.find(query).toArray();
            res.json(products)
        });

        //verify Token function 

        async function verifyToken(req, res, next){
            if(req.headers?.authorization?.startsWith('Bearer ')){
                const idToken = req.headers.authorization.split('Bearer ')[1];
                try{
                    const decodedUser = await admin.auth().verifyIdToken(idToken);
                    req.decodedUserEmail = decodedUser.email;
                }
                catch{

                }
            }
            next();
        }

            //order get from db

            app.get('/orders', verifyToken, async(req, res)=>{
                const email = req.query.email;
                if(req.decodedUserEmail===email){
                    query = {email:email}
                    const cursor = orderColection.find(query)
                    const result = await cursor.toArray();
                    res.send(result);
                }
                else{
                    res.status(401).json({message:'User not authorized'})
                }
               
            })

        //order collection add to db

        app.post('/orders', async(req, res)=>{
            const order = req.body;
            order.createdAt = new Date();
            const result = await orderColection.insertOne(order)
            res.json(result)

        })
    }
    finally{
        // await client.close();
    }

}
run().catch(console.dir)



app.get('/', (req, res)=>{
    res.send('ema jhon server is running')
})

app.listen(port, ()=>{
    console.log('port running on', port)
})