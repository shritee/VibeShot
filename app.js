const express = require('express')
var bodyParser = require('body-parser');
const cors = require('cors');
const AuthRoutes = require('./routes/user.js');

require('./db/index.js')
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use("/uploads", express.static("uploads"));
app.use(
    cors({
      origin: "http://localhost:4300", // Allow only frontend origin
      methods: "GET,POST,PUT,DELETE", // Allowed request methods
      allowedHeaders: "Content-Type,Authorization,token", // Allow custom headers
      credentials: true, // Allow sending cookies
    })
  );
// parse application/json
app.use(bodyParser.json())
app.get('/api/usertake',(req,res)=>{
    res.send({
        "user":"hello world","env":`${env.DB_PORT}`
    },)
});
app.use(express.json());
app.use('/api',AuthRoutes)
app.get('/', (req, res) => {
  res.send('Welcome to the API server');
});
app.listen(3300,(res)=>{
    console.log("Port running at 3000");
})
