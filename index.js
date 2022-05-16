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

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/available', async(req, res)=>{
            const date = req.query.date || 'May 11, 2022';

            //Get all services
            const services = await serviceCollection.find().toArray();


            //Get the booking of that date
            const query = {date: date};
            const bookings = await bookingCollection.find(query).toArray();
           

            // for each service, find bookings for that service
            services.forEach(service =>{
                const serviceBooking = bookings.filter(b=> b.treatment === service.name);
                const booked = serviceBooking.map(s => s.slot)
                const available = service.slots.filter(s => !booked.includes(s));
                service.available = available;
            })
            res.send(services)
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