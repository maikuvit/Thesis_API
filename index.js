const express = require('express');
const uuid = require('uuid');
const { exec, execSync} = require("child_process");
const fileUpload = require("express-fileupload");
const fs = require('fs');
const util = require("./utility");
const app = express()
const port = 80

const FUNCTIONS_PATH = `${__dirname + "\\files"}`;


let Executions = [];

//specify that the app is gonna require the fileUpload module 
app.use(
    fileUpload()
  );

  //TEST ONLY
app.get('/path', (req, res) => {
    res.send(`${FUNCTIONS_PATH}`)
  })

//#### deploy a function ####
app.get('/deploy/:name', (req, res) => {
    Executions[req.params.name] = [];
    //sync execution to the serverless deploy (no need to async it)
    exec(`serverless deploy`,{"cwd": util.getFunctionPath(FUNCTIONS_PATH,req.params.name)} , (error, stdout, stderr) => {
        console.log(stdout);
        res.send(stdout);
    });
})


//#### remove a function ####
app.get('/remove/:name', (req, res) => {
    //remove the function ...
    exec(`serverless remove`,{"cwd": util.getFunctionPath(FUNCTIONS_PATH,req.params.name)},(error, stdout, stderr) => {
        res.send(stdout);
    });
});


//#### invoke a function ####
app.get('/invoke/:name', (req, res) => {

    let fun_name = req.params.name;
    //to be removed! need a way to check functions already deployed!
    if(!Executions[fun_name]){
        res.send(`Function ${fun_name} has not been deployed. Please deploy the function before invoking it.`);
        return;
    }

    let token = uuid.v1();
    Executions[fun_name][token] = {
        "status" : "executing",
        "res" : ""
    };

    let cmd = `serverless invoke -f ${fun_name}`;

    // NOTE: this is an async execution! execSync is used in a Promise!
    let prom = new Promise((resolve, reject) => {
        let cont = execSync(cmd,{"cwd": util.getFunctionPath(FUNCTIONS_PATH , fun_name)});
        resolve(cont);
    });

    //when the Promise is resolved the execution is stored ...
    prom.then((content) => {
        Executions[fun_name][token]["status"] = "done";
        Executions[fun_name][token]["res"] = `${content}`;
    })

    res.send(`invoke ${fun_name} with unique id ${token} <a href="/results/${fun_name}/${token}">test</a>`);
});

app.get('/results/:name/:exec_id',(req, res) => {

    let exec_id = req.params.exec_id;
    let fun_name = req.params.name;

    //if the function has never been deployed (NOT FINAL) ...
    if(!Executions[fun_name][exec_id]) {
        res.send(`token ${exec_id} not related to an execution. `);
        return;
    }

    //if the function is still running ...
    if(Executions[fun_name][exec_id]['status'] === 'executing'){
        res.send(`execution ${exec_id} is still running.`);
        return;
    }

    //send output of the function ...
    res.send(`exec with uuid ${exec_id} has as output:\n${Executions[fun_name][exec_id]["res"]}`);
})

app.post('/upload', function(req, res) {
    //check if i have files ...
    if (!req.files) {
        return res.status(400).send("No files uploaded!");
      }

    const func = req.files.function;

    //create the needed directory ...
    const path = util.getFunctionPath(FUNCTIONS_PATH,func.name);
    fs.mkdirSync(path, { recursive: true });

    //copy file into the directory ...
    func.mv(path + func.name, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    //serverless file handler ...
    templateCopy(func.name);

    return res.send({ status: "success", path: path });
    });
  });


// ########### FILE FUNCTIONS ... ###########
function templateCopy(filename){
    // directory already created, we don't need to check it ...
    fs.copyFile('template.yml', util.getFunctionPath(FUNCTIONS_PATH,filename) + "serverless.yml", (err) => {
        if (err) throw err;
        console.log('Copied serverless file');
        injectFunctionName(util.getFunctionPath(FUNCTIONS_PATH,filename) + "serverless.yml", filename);
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
// [END] ####### FILE FUNCTIONS ... ###########

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})