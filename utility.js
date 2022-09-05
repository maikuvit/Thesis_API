
    function getPath (stdPath,filename){
        return `${stdPath + "\\" + getFilenameNoExtention(filename) }\\`;
    }
    function getFilenameNoExtention (filename){
        return filename.replace(/\.[^/.]+$/, "");
    }

    const { MongoClient } = require("mongodb");
    var dbClient; 
    var dbConnection;
    function connectDB (URI,callback) {
        dbClient = new MongoClient(URI);
        dbClient.connect(function (err, db) {
          if (err || !db) {
            return callback(err);
          }
    
        dbConnection = db.db("functions_API");
        console.log("Connected to MongoDB.");
        return callback();
        });
    }

    function getDB(){
        return dbConnection;
    }


    module.exports = {getPath , getFilenameNoExtention, connectDB, getDB}