const bearychat = require('bearychat');

const token = process.env.HUBOT_BEARYCHAT_TOKENS;

module.exports = {
    sendFile: (id)=>{
        bearychat.message.create({
            token,
            vchannel_id: id,
            text: "中午吃啥啊",
            attachments: ["中午吃什么？"]

        }).then(resp => resp.json())
        .then(data => console.log(data));
    }    
}