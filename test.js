const { exec } = require("child_process");
const { execSync} = require('child_process');

const FUNCTIONS_PATH = `${__dirname + "\\functions"}`;
console.log(`${FUNCTIONS_PATH + "\\" + "helloworld"}`);

let PATH = "C:\\Users\\miche\\Documents\\thesis_material\\DEMO\\Nodejs_API\\functions\\helloworld";
var cmd = `serverless invoke -f helloworld`;

/*var invoke = new Promise(() => {
    var cont = execAync(cmd,{"cwd": PATH}).toString();
});
*/

var cont = execSync(cmd,{"cwd": PATH,stdio: 'inherit'});


/*
exec(cmd,{"cwd": PATH,
        "shell" : "powershell"}, (error, stdout, stderr) => {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
});


const { spawn } = require("child_process");
const ls = spawn("serverless", ["invoke", "-f", "helloworld"],{"cwd":PATH});

ls.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
});

ls.on('error', (error) => {
    console.log(`error: ${error.message}`);
});

ls.on("close", code => {
    console.log(`child process exited with code ${code}`);
});
*/