const express = require('express');
const uuid = require('uuid')
const { exec } = require("child_process");
const { executionAsyncId } = require('async_hooks');
const { stdout } = require('process');
const app = express()
const port = 80

const FUNCTIONS_PATH = `${__dirname + "\\functions"}`;
var Executions = [];

app.get('/path', (req, res) => {
    res.send(`${FUNCTIONS_PATH}`)
  })

//#### deploy a function ####
// to add: generate yaml
//         check and deploy function 
//         error handling
app.get('/deploy/:name', (req, res) => {
    Executions[req.params.name] = [];
    exec(`serverless deploy`,{"cwd":`${FUNCTIONS_PATH + "\\" + req.params.name}`} , (error, stdout, stderr) => {
        console.log(stdout);
        res.send(stdout);
    });
})


//#### remove a function ####
app.get('/remove/:name', (req, res) => {
    exec(`serverless remove`,{"cwd":`${FUNCTIONS_PATH + "\\" + req.params.name}`},(error, stdout, stderr) => {
        res.send(stderr);
    });
});


//#### invoke a function ####
app.get('/invoke/:name', (req, res) => {

    var fun_name = req.params.name;
    console.log(Executions[fun_name]);
    Executions[fun_name] = [];
    if(!Executions[fun_name]){
        res.send(`Function ${fun_name} has not been deployed. Please deploy the function before invoking it.`);
        return;
    }

    var token = uuid.v1();
    Executions[fun_name][token] = {
        "status" : "executing",
        "res" : ""
    };

    let cmd = `serverless invoke -f ${fun_name}`;
    console.log(cmd);
    exec(cmd,{"cwd":`${FUNCTIONS_PATH + "\\" + req.params.name}`}, (error, stdout, stderr) => {
            console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA");
            Executions[fun_name][token]["status"] = "done";
            Executions[fun_name][token]["res"] = `${stdout}`;
        });
    res.send(`invoke ${fun_name} with unique id ${token} <a href="/results/${fun_name}/${token}">test</a>`);
});

app.get('/results/:name/:exec_id',(req, res) => {
    let exec_id = req.params.exec_id;
    var fun_name = req.params.name;

    if(!Executions[fun_name][exec_id]) {
        res.send(`token ${exec_id} not related to an execution. `);
        return;
}
    
    if(Executions[fun_name][exec_id]['status'] == 'executing'){
        res.send(`execution ${exec_id} is still running.`);
        return;
    }
    res.send(`exec with uuid ${req.params.exec_id} has as output:\n${Executions[fun_name][req.params.exec_id]["res"]}`);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})