const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


console.log(process.env.DB_USER);
console.log(process.env.DB_PASS)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4d9dszy.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const propertiesCollection = client.db("evergreenDb").collection("properties");
        const reviewCollection = client.db("evergreenDb").collection("review");
        const userCollection = client.db("evergreenDb").collection("users");
        const wishlistCollection = client.db("evergreenDb").collection("wishlist");


        // Property related api
        // Create data
        app.post('/properties', async (req, res) => {
            const newProperty = req.body;
            console.log(newProperty);
            const result = await propertiesCollection.insertOne(newProperty);
            res.send(result);
        })


        // Read date
        app.get('/properties', async (req, res) => {
            const result = await propertiesCollection.find().toArray();
            res.send(result);
        })



        // Review related api
        // Create Request food data
        app.post('/review', async (req, res) => {
            const newPropertyReview = req.body;
            console.log(newPropertyReview);
            const result = await reviewCollection.insertOne(newPropertyReview);
            res.send(result);
        })

        // Read Request Food Data
        app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // Users related Api
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })


        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     if (email !== req.decoded.email) {
        //         return res.status(403).send({ message: 'Forbidden access' })
        //     }

        //     const query = { email: email };
        //     const user = await userCollection.findOne(query);
        //     let admin = false;
        //     if (user) {
        //         admin = user?.role === 'admin';
        //     }
        //     res.send({ admin });
        // })


        app.post('/users', async (req, res) => {
            const user = req.body;

            // Insert email if user doesn't exist
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exists', insertedIs: null })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        })


        // app.patch('/users/admin/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const updatedDoc = {
        //         $set: {
        //             role: 'admin'
        //         }
        //     }
        //     const result = await userCollection.updateOne(filter, updatedDoc);
        //     res.send(result);
        // })



        // app.delete('/users/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await userCollection.deleteOne(query);
        //     res.send(result);
        // })


        // wishlist related api
        app.post('/wishlist', async (req, res) => {
            const wishlistItem = req.body;
            const result = await wishlistCollection.insertOne(wishlistItem);
            res.send(result);
        })


        // Read wishlist Data
        app.get('/wishlist', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = wishlistCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })


        // Delete wishlist Data
        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishlistCollection.deleteOne(query);
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Evergreen Estate is Running');
})

app.listen(port, () => {
    console.log(`Evergreen Estate is running on port ${port}`);
})