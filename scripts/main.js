const prettier = require("prettier");

module.exports = (robot)=>{
    robot.hear(/((?<=\{).*(?=\}))/,(res)=>{
        let codeBody;
        console.log(res.match[1]);
        try{
            codeBody = prettier.format("{"+res.match[1]+"}",{
                parser: "json"
            });
        }catch(e){
            // console.log(e);
            // console.log(codeBody);   
        }
        if(!codeBody){
            // res.send(null);
        }else{
            res.send("```json\n" + codeBody + "\n```")
        }
    })
    robot.respond(/t:([a-z|A-Z]+) ([\d\D]*)/,(res)=>{
        console.log('translate',res.match[0]);
        let codeType,codeBody;
        try{
            codeType = res.match[1];
            codeBody = prettier.format(res.match[2]);
        }catch(e){
            // console.log(e);
            // console.log(codeBody);  
        }
        if(!codeBody){
            // res.reply("无法识别代码格式！你输入格式为："+codeType);
            // 为代码片段，简单格式化
            res.reply("无法识别，简单格式化处理：\n```"+codeType+"\n" + res.match[2] + "\n```");
        }else{
            res.reply("```"+codeType+"\n" + codeBody + "\n```");
        }
    })
    robot.respond(/(\{.*\})$/i,(res)=>{
        console.log('jsonFormatter',res.match[0]);
        let codeBody;
        try{
            codeBody = prettier.format(res.match[1],{
                parser: "json"
            });
            // codeBody = JSON.stringify(JSON.parse(res.match[1]), null, 2)
        }catch(e){
            // console.log(e);
            // console.log(codeBody);   
        }

        if(!codeBody){
            res.reply("无法识别！该方法仅支持JSON格式，请使用@robot translate:javascript 代码");
        }

        res.reply("```json\n" + codeBody + "\n```");
        // console.log("(1):",res.match[1]);
    })
    robot.respond(/api:\s?(\S*) method:\s?(get|method)\s?(\{.*\})?/,(res)=>{
        if(!res.match[2]){
            res.reply("method仅支持get与post！（注意大小写）");
        }
        if(!res.match[1]){
            res.reply("api地址错误");
        }
        let resultBody,postDataBody;

        if(res.match[2] === "get"){
            robot.http(res.match[1]).get()((err,resp,body)=>{
                if(err){
                    res.reply("请求发生错误：:\n"+e);
                }
                let resultDataBody;
                try{
                    resultDataBody = prettier.format(body,{
                        parser: "json"
                    });
                }catch(reqE){
                    console.log("返回数据格式化出错，目前仅支持json格式：\n",reqE)
                }
                resultBody = `\*\*API:\*\*\n ${res.match[1]}\n\*\*Response:\*\*\n\`\`\`json\n${resultDataBody}\n\`\`\``;
                res.reply(resultBody);
            })
        }else if(res.match[2] === "post"){
            try{
                postDataBody = prettier.format(res.match[3],{
                    parser: "json"
                });
                // codeBody = JSON.stringify(JSON.parse(res.match[1]), null, 2)
            }catch(e){
                // console.log(e);
                // console.log(codeBody);   
                res.reply("请求数据出错，仅支持json格式：\n",e)
                return ;
            }
            robot.http(res.match[1]).post(res.match[3])((err,resp,body)=>{
                if(err){
                    res.reply("请求发生错误：\n"+e);
                }
                let resultDataBody;
                try{
                    resultDataBody = prettier.format(body);
                }catch(reqE){
                    console.log("返回数据格式化出错：\n",reqE)
                }
                resultBody = `\*\*API:\*\*\n ${res.match[1]}\n\*\*Request:\*\* \n\`\`\`json\n${postDataBody}\n\`\`\`\n\*\*Response\*\*: \n\`\`\`json\n${resultDataBody}\n\`\`\``;
                res.reply(resultBody);

            })
        }

    })
}