
const {exec} = require('child_process');

module.exports = (textData,outPut,cwdPath)=>{
    return exec('carbon-now "' + textData + '" -h -t ' + outPut,{
        cwd: cwdPath + '/'
    },(error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        // console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}