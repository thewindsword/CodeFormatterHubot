const os = require("os");
const { exec } = require("child_process");

module.exports = ()=>{
    // suport Linux exec    
    if(os.platform() === "linux"){
        return exec("rm ./temp/*",(err,stdout,stderr)=>{
            if(err){
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        })
    }
    
}