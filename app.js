const express = require('express');
const app = express();
const mongoose= require('mongoose');
require("dotenv").config();
const port = process.env.PORT || 3000

mongoose.connect( process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}, () => {
    console.log("Database connected !");
});

require('./models/user');
require('./models/post')

//middlewares

app.use(express.json());
app.use(require('./routes/auth'));
app.use(require('./routes/post'));
app.use(require('./routes/user'));

app.listen(port, () => {
    console.log("Server is up at " + port);
});