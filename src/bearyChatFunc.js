const bearychat = require('bearychat');

const token = process.env.HUBOT_BEARYCHAT_TOKENS;

module.exports = {
    sendFile: ()=>{
        console.log(process.env);
        console.log(token);

        bearychat.rtm.start({
            token,
        }).then(resp=>resp.json())
        .then(data=>console.log(data))
    }    
}