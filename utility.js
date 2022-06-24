
    function getFunctionPath (stdPath,filename){
        console.log(filename);
        return `${stdPath + "\\" + getFilenameNoExtention(filename) }\\`;
    }

    function getFilenameNoExtention (filename){
        return filename.replace(/\.[^/.]+$/, "");
    }

    module.exports = {getFunctionPath , getFilenameNoExtention}