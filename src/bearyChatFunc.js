const bearychat = require('bearychat');

const token = process.env.HUBOT_BEARYCHAT_TOKENS;

module.exports = {
    sendFile: (id)=>{
        console.log('vchannel_id:'+id);
        bearychat.message.create({
            token,
            vchannel_id: id,
            text: "中午吃啥啊",
            attachments: [
                {
                    color: "#ccc",
                    text: "中午吃什么？"
                }
            ]

        }).then(resp => resp.json())
        .then(data => console.log(data));
    }    
}