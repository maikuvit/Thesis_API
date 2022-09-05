const express = require('express');
const uuid = require('uuid');
const { exec, execSync} = require("child_process");
const bodyParser = require('body-parser')
const fileUpload = require("express-fileupload");
const fs = require('fs');
const util = require("./utility");
const axios = require("axios");
const {getPath} = require("./utility");
const { MongoClient } = require("mongodb");
const openwhisk = require('openwhisk');
const { toNamespacedPath, resolve } = require('path');
const { constants } = require('buffer');

const dotenv = require('dotenv');
const { resourceLimits } = require('worker_threads');
dotenv.config();


const connStringDB = "mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=false";

const app = express()
const ow = openwhisk();
const port = 80

const FUNCTIONS_PATH = `${__dirname + "\\files"}`;

var jsonParser = bodyParser.json();

//specify that the app is gonna require the fileUpload module 
app.use(
    fileUpload()
  );

console.log(process.env.__OW_API_HOST);

//database connection ...
util.connectDB(connStringDB, function (err) {
if (err) {
    console.error(err);
    process.exit();
}});
//get the db object where to query ...

//TEST ONLY
app.get('/path', (req, res) => {
    res.send(`${FUNCTIONS_PATH}`)
  })

//#### deploy a function ####
app.get('/deploy/:name', (req, res) => {
    console.log(util.getPath(FUNCTIONS_PATH,req.params.name));
    //sync execution to the serverless deploy (no need to async it)
    exec(`serverless deploy`,{"cwd": util.getPath(FUNCTIONS_PATH,req.params.name)} , (error, stdout, stderr) => {
        console.log(stdout);
        res.send(stdout);

        const dbClient = util.getDB();

        dbClient.createCollection(req.params.name, function(err, res) {
            if (err) console.log(err);
            console.log("Collection created!");
          });
    });
})

//#### remove a function ####
app.get('/remove/:name', (req, res) => {
    //remove the function ...
    exec(`serverless remove`,{"cwd": util.getPath(FUNCTIONS_PATH,req.params.name)},(error, stdout, stderr) => {
        res.send(stdout);
    });
});

//#### invoke a function ####
app.post('/invoke/:name', jsonParser, (req, res) => {

    let fun_name = req.params.name;
    console.log(req.body);
    let params = req.body;
    let webhooks = [];
    if (req.body.webhooks){
        webhooks = req.body.webhooks;
        delete params[webhooks];
    }

    let token = uuid.v1();
    const dbClient = util.getDB();

    let name = `functions-dev-${fun_name}`;
    const blocking = true, result = true

    let options = {name, blocking, result, params};
    ow.actions.invoke(options).then(async (exec_res) => {

        //assegno token sub ...
        exec_res._id = token;
        console.log(exec_res);
        var out = await dbClient.collection(fun_name).insertOne(exec_res);
        console.log(out);
        //webhooks handling ...
        webhooksHandler(webhooks,exec_res);
    } )
    .catch((err) => console.log(err));

    //return del token ...
    res.send(`invoke ${fun_name} with unique id ${token} <a href="/results/${fun_name}/${token}">test</a>`);
 
});

app.get('/results/:name/:exec_id',async (req, res) => {

    let exec_id = req.params.exec_id;
    let fun_name = req.params.name;

    const dbClient = util.getDB();
    //call al db in lettura ...
    dbClient.collection(fun_name)
    .find({"_id": exec_id})
    .limit(1)
    .toArray(function (err, result) {
        if (err) {
          res.status(400).send("Error fetching listings!");
       } else {
        if(result.length == 0){
            res.status(400).send("couple function/exec_code not exists");
            return;
        }
        //qui posso modificare il return 
        //(es: res vuoto -> no execution found)
        // posso anche aggiungere una collection per ogni function 
          res.status(200).json(result);
        }
    });    
});

app.post('/upload', function(req, res) {
    //check if i have files ...
    let req_libraries = false;
    if (!req.files) {
        return res.status(400).send("No files uploaded!");
      }
    if (!req.files.function){
        return res.status(400).send("No function file uploaded!");
    }

    const func = req.files.function;
    //create the needed directory ...
    const path = util.getPath(FUNCTIONS_PATH,func.name);
    fs.mkdirSync(path, { recursive: true });

    if (req.files.requirements) {
        const requirements = req.files.requirements;
        req_libraries = true;
        requirements.mv(path + "requirements.txt", (err) => {if (err) {
            return res.status(500).send(err);
        }});
    }

    //copy file into the directory ...
    func.mv(path + func.name, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    //serverless file handler ...
    templateCopy(func.name,req_libraries);

    return res.send({ status: "success", path: path });
    });
  });

// ########### FILE FUNCTIONS ... ###########
function templateCopy(filename, requireLibraries = false){
    // directory already created, we don't need to check it ...
    let templPath = "simple_template.yml";
    if(requireLibraries) templPath = "lib_template.yml";
    fs.copyFile(templPath, util.getPath(FUNCTIONS_PATH,filename) + "serverless.yml", (err) => {
        if (err) throw err;
        console.log('Copied serverless file');
        injectFunctionName(util.getPath(FUNCTIONS_PATH,filename) + "serverless.yml", filename);
        console.log('template injected with function name');
    });
}

function injectFunctionName(filepath, filename){
    let functionName = util.getFilenameNoExtention(filename);
    fs.readFile(filepath, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        let res = data.replace(/<FUN>/g, functionName);

        fs.writeFile(filepath, res, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

function webhooksHandler(webhooks,results){
    for(let w in webhooks){
        console.log(webhooks[w]);
        axios.post(webhooks[w], results);
    } 
}

// [END] ####### FILE FUNCTIONS ... ###########

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})