const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

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

        //order collection add to db

        app.post('/orders', async(req, res)=>{
            const order = req.body;
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