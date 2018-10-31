const bearychat = require('bearychat');

const token = process.env.HUBOT_BEARYCHAT_TOKENS;

module.exports = {
    sendFile: async (id)=>{
        return await bearychat.message.query({
            token,
            vchannel_id: id,
            query: {
                latest: {
                    limit: 50,
                }
            }
        }).then(resp => resp.json());
    },
    checkUserList: async ()=>{
        return await bearychat.user.list({
            token
        }).then(resp=>resp.json())
    }
}