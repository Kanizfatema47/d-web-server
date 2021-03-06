const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const query = require('express/lib/middleware/query');


require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express()


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4nilh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const serviceCollection = client.db('Doctors_portal').collection('servies');
        const bookingCollection = client.db('Doctors_portal').collection('bookings');
        const userCollection = client.db('Doctors_portal').collection('users');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.put('/user/:email', async(req,res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email:email};
            const options = {upsert: true}
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.get('/available', async(req, res)=>{
            const date = req.query.date ;

            // Step 1: Get all services
            const services = await serviceCollection.find().toArray();

            // Step 2: Get the booking of that day. output [{}, {}, {}, {}]
            const query = {date: date};
            const bookings = await bookingCollection.find(query).toArray();

            //Step 3: For each service
            
            services.forEach (service => {


                //Step 4: Find booking for that service. output [{}, {}, {},{}]

                const serviceBookings = bookings.filter(book => book.treatment === service.name);

                // Step 5: select slots for the service  Bookings: ['', '', '', '']

                const bookedSlots = serviceBookings.map(book => book.slot);

                // Step 6: Select those slots that are not in bookSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));

                // Step 7: Set available to slots to make it easier

                service.slots = available;
            })
            
        
        res.send(services)
        })

        app.get('/booking', async(req, res)=>{
            const patient = req.query.patient;
            const query = {patient: patient}
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })


        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query)
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result })
        })
    }


    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from server')
})

app.listen(port, () => {
    console.log(`Doctors Port ${port}`)
})