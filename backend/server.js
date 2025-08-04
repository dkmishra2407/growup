const express = require('express')
const app = express()
const UserRoutes = require('./Routes/UserRoutes')
const WatchlistRoutes = require('./Routes/WatchlistRoutes')
require('dotenv').config();
const cors = require('cors');
const db = require('./dbconfig/dbconfig');
const HoldingRoutes = require('./Routes/HoldingRoutes');
const path=require('path')
app.use(express.json())
app.use(cors({
    origin: '*', // <-- You can restrict to specific origins like 'http://localhost:3000'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use('/', UserRoutes)
app.use('/stocks',WatchlistRoutes);
app.use('/holding', HoldingRoutes);
const port=process.env.PORT;

app.get('/', (req, res) => {
    return res.json( {success:true,message:"Hello from backend"})
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})