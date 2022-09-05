const express = require("express");
const axios = require("axios");
const bodyParser = require('body-parser');
const app = express()
var port = 3232

var jsonParser = bodyParser.json();

app.post("/", jsonParser, (req,res) => {
    console.log(req.body)
    let webhooks = req.body.webhooks;
    console.log(webhooks);
    for(let w in webhooks){
        console.log(webhooks[w]);
        axios.get(webhooks[w], "hola").then((results) => {
            console.log("yess");
        });
    } 
    res.send("ok")
})



app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })