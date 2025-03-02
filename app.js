const express = require('express')
var bodyParser = require('body-parser');
const cors = require('cors');
const AuthRoutes = require('./routes/user.js');

require('./db/index.js')
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
    origin: 'http://localhost:4300', // Allow Angular frontend
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
  }));
// parse application/json
app.use(bodyParser.json())
app.get('/',(req,res)=>{
    res.send("hello world")
});
app.use(express.json());
app.use('/',AuthRoutes)
app.listen(3300,()=>{
    console.log("Port running at 3000");
    
})