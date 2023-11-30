const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
        const offeredAmountCollection = client.db("evergreenDb").collection("offeredAmount");
        const paymentCollection = client.db("bistroDb").collection("payments");


        // Jwt related API
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })



        // Verify middlewares
        const verifyToken = (req, res, next) => {
            console.log('Inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }


        // Use verify admin after verify token
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }


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


        // Read one data for update
        app.get('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await propertiesCollection.findOne(query);
            res.send(result);
        })

        // Update property data
        app.patch('/properties/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    propertyTitle: item.propertyTitle,
                    minPriceRange: item.minPriceRange,
                    maxPriceRange: item.maxPriceRange,
                    location: item.location,
                    propertyImage: item.propertyImage,
                    description: item.description,
                    agentImage: item.agentImage,
                    role: item.role
                }
            }
            const result = await propertiesCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // Delete Property data
        app.delete('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await propertiesCollection.deleteOne(query);
            res.send(result);
        })


        // update verify button
        app.patch('/properties/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            }
            console.log(updatedDoc)
            const result = await propertiesCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // update reject button
        app.patch('/properties/reject/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Rejected'
                }
            }
            const result = await propertiesCollection.updateOne(filter, updatedDoc);
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

        // Delete Review
        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })


        // Users related Api
        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })


        // Admin
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        // Agent
        app.get('/users/agent/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let agent = false;
            if (user) {
                agent = user?.role === 'agent';
            }
            res.send({ agent });
        })


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


        // API to update user to admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // API to update user to agent
        app.patch('/users/agent/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'agent'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })




        // API to update user to fraud
        app.patch('/users/fraud/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'fraud'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });



        // Delete user
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })



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


        // Offered Amount related api
        // Create Request food data
        app.post('/offeredAmount', async (req, res) => {
            const newPropertyReview = req.body;
            console.log(newPropertyReview);
            const result = await offeredAmountCollection.insertOne(newPropertyReview);
            res.send(result);
        })

        // Read Request Food Data
        app.get('/offeredAmount', async (req, res) => {
            const cursor = offeredAmountCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // update Accept button
        app.patch('/offeredAmount/accepted/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Accepted'
                }
            }
            console.log(updatedDoc)
            const result = await offeredAmountCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // update reject button
        app.patch('/offeredAmount/reject/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Rejected'
                }
            }
            const result = await offeredAmountCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })




        // Payment related api
        // payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            console.log(amount, 'amount inside the intent')

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        });


        app.get('/payments/:email', verifyToken, async (req, res) => {
            const query = { email: req.params.email }
            if (req.params.email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        })



        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentCollection.insertOne(payment);

            //  carefully delete each item from the cart
            console.log('payment info', payment);
            const query = {
                _id: {
                    $in: payment.cartIds.map(id => new ObjectId(id))
                }
            };

            const deleteResult = await offeredAmountCollection.deleteMany(query);

            res.send({ paymentResult, deleteResult });
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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