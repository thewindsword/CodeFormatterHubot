const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const stringHash = require("string-hash");

const carbonFunc = require('../src/carbonExec');
const clearTempFunc = require('../src/clearTemp');
const bearyChatTools = require('../src/bearyChatFunc');
const shorterDataFunc = require('../src/shorterDataFunc');

const FormData = require('form-data');
const axios = require('axios');
var CancelToken = axios.CancelToken;

// const axiosJSON = axios.create()


let TEMP_PATH = path.resolve(__dirname, '../temp/');

module.exports = (robot)=>{
    robot.hear(/((?<=\{).*(?=\}$))/,(res)=>{
        // console.log("jsonHear",res.match[0]);
        let codeBody;
        // console.log(res.match[1]);
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
            res.send("```json\n" + codeBody + "\n```");
        }
    })
    robot.respond(/t:([a-z|A-Z]+) ([\d\D]*)/,(res)=>{
        res.reply("代码格式化处理中...")
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
    robot.respond(/img t:([a-z|A-Z]+) ([\d\D]*)$/,(res)=>{
        console.log('img translate',res.match[0]);
        res.reply("图片生成中！");
        // hubot-test: img t:javascript function(){let a = 222; }
        let prepareToWrite = res.match[2],
            fileExt,
            fileParser,
            fileName = 'temp_'+stringHash(prepareToWrite);
        switch(res.match[1]){
            case "javascript":
                fileExt = '.js';
                break;
            case "typescript":
                fileExt = '.ts';
                break;
            case "css":
                fileExt = '.css';
                fileParser = 'css';
                break;
            case "scss":
                fileExt = '.scss';
                fileParser = 'scss';
                break;
            case "less":
                fileExt = '.less';
                fileParser = 'less';
                break;
            case "json":
                fileExt = '.json';
                fileParser = 'json';
                break;
            case "markdown":
                fileExt = '.md';
                fileParser = 'markdown';
                break;
            case "vue":
                fileExt = '.vue';
                fileParser = 'vue';
                break;
            case "yaml":
                fileExt = '.yaml';
                fileParser = 'yaml';
                break;
            default: 
                fileExt = '.txt';
        }
        try{
            if(fileParser){
                prepareToWrite = prettier.format(prepareToWrite,{
                    parser: fileParser
                });
            }else{
                prepareToWrite = prettier.format(prepareToWrite);
            }
        }catch(e){
            // console.log(e);
            prepareToWrite = res.match[2];
        }
        
        fs.writeFileSync(TEMP_PATH + '/' + fileName + fileExt, prepareToWrite, {
            flag: 'w'
        });
        let child_carbon = carbonFunc(fileName + fileExt,fileName,TEMP_PATH);
        child_carbon.on('exit',function(code){
            console.log('exit:'+code);
            if(code === 0){
                // 保存成功 fs.existsSync(TEMP_PATH + '/' + fileName + '.png')

                // let data = base64Img.base64Sync(TEMP_PATH + '/' + fileName + '.png');
                // res.reply(`![code](${data})`);
                // console.log('base64.length:'+data.length);

                // base64由于消息长度原因会被截断，改用图床

                let formData = new FormData();
                formData.append('smfile',fs.createReadStream(TEMP_PATH + '/' + fileName + '.png'));

                axios.post('https://sm.ms/api/upload', formData, {
                    headers: formData.getHeaders(),
                }).then(result => {
                    // Handle result…
                    if(result.data.code !== "success"){
                        res.reply("图片上传失败："+result.data.msg);
                    }
                    // console.log(result.data);
                    res.reply(`![code](${result.data.data.url})`);
                }).catch(er => res.reply("图片上传失败："+er));
                

            }else{
                res.reply("生成图片失败！");
            }
        });
        
    })
    robot.respond(/img clear$/,(res)=>{
        res.send("开始清理服务器缓存!");
        clearTempFunc();
        robot.http("https://sm.ms/api/clear")
        .get()((err,resp,body)=>{
            if(err){
                res.reply("请求发生错误：:\n"+e);
            }
            body = JSON.parse(body);
            if(body.code === "success"){
                res.reply("清楚成功："+body.msg);
            }else{
                res.reply("清除失败："+body.msg);
            }
        })
    })
    robot.respond(/api:\s?(\S*) method:\s?(get|post)\s?(\{.*\})?/,(res)=>{
        let source = CancelToken.source();
        setTimeout(()=>{
            res.reply("请求超时");
            source.cancel();
        },10000)
        res.send("接收到API生成请求!");
        if(!res.match[2]){
            res.reply("method仅支持get与post！（注意大小写）");
        }
        if(!res.match[1]){
            res.reply("api地址错误");
        }
        let postDataBody;

        if(res.match[2] === "get"){
            axios
            .get(res.match[1],{
                timeout: 10*1000,
                responseType:'json',
                headers: {
                    'Accept': 'application/json',
                    'content-type': 'application/json'
                },
                maxContentLength: 1048576,
                cancelToken: source.token,
            })
            .then((response)=>{
                let resultDataBody,resultBody;
                // console.log("header:", response.headers);
                // console.log("data:", response.data);
                console.log(response.headers['content-type']);
                console.log(/application\/json/.test(response.headers['content-type']));
                if(/application\/json/.test(response.headers['content-type'])){
                    // JSON 格式数据
                    if(+response.headers['content-length'] > 10000){
                        resultDataBody = shorterDataFunc(response.data,res);
                    }else{
                        resultDataBody = response.data
                    }
                    try{
                        if(typeof resultDataBody !== 'object'){
                            
                        }else{
                            resultDataBody = prettier.format(JSON.stringify(resultDataBody),{
                                parser: "json"
                            });
                        }
                    }catch(reqE){
                        console.log("返回数据格式化出错，目前仅支持json格式：\n",reqE);
                    }
                    resultBody = `\*\*API:\*\*\n ${res.match[1]}\n\*\*Response:\*\*\n\`\`\`json\n${resultDataBody}\n\`\`\``;
                    res.reply(resultBody);
                }else{
                    res.reply("不支持该返回类型");
                }
            })
            .catch((error)=>{
                console.log('Error', error);
                if (!error.response) {
                    res.reply("请求错误:",error.message);
                    source.cancel();
                    return;
                }
                if(error.response && error.response.data){
                    res.reply("请求错误:",error.response.data);
                }else{
                    res.reply("请求错误:",error.response.status);
                }
            })
        }else if(res.match[2] === "post"){
            try{
                if(!res.match[3]){
                    postDataBody = "{}"
                }else{
                    postDataBody = prettier.format(res.match[3],{
                        parser: "json"
                    });
                }
            }catch(e){
                res.reply("POST数据出错，仅支持json格式：\n",e)
                return ;
            }
            axios.post(res.match[1],JSON.parse(postDataBody),{
                timeout: 10*1000,
                responseType:'json',
                headers: {
                    'Accept': 'application/json',
                    'content-type': 'application/json'
                },
                maxContentLength: 1048576,
                cancelToken: source.token,
            })
            .then((response)=>{
                let resultDataBody,resultBody;
                // console.log("header:", response.headers);
                // console.log("data:", response.data);
                if(/application\/json/.test(response.headers['content-type'])){
                    // JSON 格式数据
                    if(+response.headers['content-length'] > 10000){
                        resultDataBody = shorterDataFunc(response.data,res);
                    }else{
                        resultDataBody = response.data
                    }
                    try{
                        if(typeof resultDataBody !== 'object'){
                            
                        }else{
                            resultDataBody = prettier.format(JSON.stringify(resultDataBody),{
                                parser: "json"
                            });
                        }
                    }catch(reqE){
                        console.log("返回数据格式化出错，目前仅支持json格式：\n",reqE)
                    }
                    resultBody = `\*\*API:\*\*\n ${res.match[1]}\n\*\*Request:\*\* \n\`\`\`json\n${postDataBody}\n\`\`\`\n\*\*Response\*\*: \n\`\`\`json\n${resultDataBody}\n\`\`\``;
                    res.reply(resultBody);
                }else{
                    res.reply("不支持该返回类型");
                }
            })
            .catch((error)=>{
                if (!error.response) {
                    res.reply("请求错误:",error.message);
                    source.cancel();
                    return;
                }
                if(error.response && error.response.data){
                    res.reply("请求错误:",error.response.data);
                }else{
                    res.reply("请求错误:",error.response.status);
                }
            })
        }

    })

    robot.respond(/test getFile$/,(res)=>{
        let vchannel_id,text,attachments;

        console.log(res.message.room);

        vchannel_id = res.message.room.vchannelId;

        let data = bearyChatTools.sendFile(vchannel_id);
        data.then(data=>{
            console.log(data);
            let result = [],resultData = '查询最近api信息为：';
            let apiCatch = /api:\s?(\S*) method:\s?(get|post)/;
            data.messages.forEach(messageItem=>{
                if(/api:/.test(messageItem.text)){
                    let [apiURL,apiMethod] = apiCatch.exec(messageItem.text).slice(1,3);
                    messageItem.apiURL = apiURL.trim();
                    messageItem.apiMethod = apiMethod.trim();
                    result.push(messageItem);
                }
            });
            res.reply(result.reduce((messageString,messageItem)=>{
                messageString += `\n\[${messageItem.apiMethod}\][${messageItem.apiURL}](messageItem.apiURL)`
            }),resultData);
        })
    })

    robot.respond(/\-\-help$/,(res)=>{
        res.send(`用法列表：
1. 输入 {JSON数据} 将会自动返回格式化的JSON数据
2. @bot t:语言 代码片段
3. @bot img t:语言 代码片段
4. @bot img clear 清除服务器缓存（将删除过往图片）
5. @bot api:API地址 method:get/post 数据
        `);
    })
    robot.respond(/\-h$/,(res)=>{
        res.send(`用法列表：
1. 输入 {JSON数据} 将会自动返回格式化的JSON数据
2. @bot t:语言 代码片段
3. @bot img t:语言 代码片段
4. @bot img clear 清除服务器缓存（将删除过往图片）
5. @bot api:API地址 method:get/post 数据
        `);
    })
}