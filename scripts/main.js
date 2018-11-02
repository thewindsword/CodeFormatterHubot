const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const stringHash = require("string-hash");

const carbonFunc = require('../src/carbonExec');
const clearTempFunc = require('../src/clearTemp');
const bearyChatTools = require('../src/bearyChatFunc');
const shorterDataFunc = require('../src/shorterDataFunc');
const getProgrammerCalendar = require('../src/getProgrammerCalendar');

// about xml 
const xml2js = require('xml2js');
const parseString = xml2js.parseString;
const xmlBuilder = new xml2js.Builder();
const xmlFormat = require('xml-formatter');

const { getFileExt } =  require('../src/utilsFunc');

const FormData = require('form-data');
const axios = require('axios');
var CancelToken = axios.CancelToken;

// [补充] 
// Github地址：https://github.com/thewindsword/CodeFormatterHubot

// [新增]
// 1. 获取今天的程序员老黄历
// 命令为：
// ```
// @bot today
// ````
// ![](https://s1.ax1x.com/2018/11/02/ifzlK1.png)

// 2. 通过唤起[TinyBear机器人](https://www.v2ex.com/t/502933)输出压缩后图片
// 命令为：
// ```
// @bot img compress t:语言 代码片段
// ````
// ![](https://s1.ax1x.com/2018/11/02/ifzvs1.png)

// 3. 增加帮助命令
// 命令为：
// ```
// @bot help
// @bot -h
// @bot --help
// ```


let TEMP_PATH = path.resolve(__dirname, '../temp/');

module.exports = (robot)=>{
    robot.hear(/(t:json)\s?((?<=\{).*(?=\}$))/,(res)=>{
        if(res.match[1]){
            return;
        }
        let codeBody;
        try{
            codeBody = prettier.format("{"+res.match[2]+"}",{
                parser: "json"
            });
        }catch(e){
        }
        if(!codeBody){

        }else{
            res.send("```json\n" + codeBody + "\n```");
        }
    })
    robot.hear(/(t:xml)\s?((?<=\<).*(?=\>$))/,(res)=>{
        if(res.match[1]){
            return;
        }
        let catchXML = "<"+res.match[2]+">";
        let result;
        parseString(catchXML,(err, parseBody)=>{
            if(err){
                // console.log(err);
                return;
            }
            try{
                result = xmlFormat(catchXML);
            }catch(e){
                console.log(e);
            }
            if(result){
                res.reply("```xml\n" + result + "\n```");
            }
        })
    })

    // 转换 json 为 xml
    robot.respond(/tx[\s]?(\{[\d\D]*\}$)/,(res)=>{
        let catchJSON = res.match[1];
        let result;
        try{
            catchJSON = JSON.parse(catchJSON);
            result = xmlFormat(xmlBuilder.buildObject(catchJSON));
        }catch(e){
            console.log(e);
            res.reply("转换为xml失败");
        }
        if(result){
            res.reply("```xml\n" + result + "\n```");
        }
    })
    // 转换 xml 为 json
    robot.respond(/tj[\s]?(\<[\d\D]*\>$)/,(res)=>{
        let catchXML = res.match[1];
        console.log(catchXML);
        let result;
        parseString(catchXML,(err, parseBody)=>{
            if(err){
                console.log(err);
                res.reply("转换为json失败")
                return;
            }
            parseBody = JSON.stringify(parseBody);
            try{
                result = prettier.format(parseBody,{parser: 'json'});
            }catch(e){
                console.log(e);
            }
            if(result){
                res.reply("```json\n" + result + "\n```");
            }else{
                res.reply("无法格式化，简单格式化处理：\n```json\n" + parseBody + "\n```");
            }
        })
    })
    //<xml><MsgId>6197906553041859764</MsgId></xml>
    robot.respond(/t:([a-z|A-Z]+) ([\d\D]*)/,(res)=>{
        res.reply("代码格式化处理中...")
        let codeType,codeBody;
        let [,fileParser] = getFileExt(res.match[1]);
        try{
            codeType = res.match[1];
            
            if(fileParser){
                codeBody = prettier.format(res.match[2],{
                    parser: fileParser
                });
            }else{
                if(codeType === 'xml'){
                    codeBody = xmlFormat(res.match[2]);
                }else{
                    codeBody = prettier.format(res.match[2]);
                }
            }
        }catch(e){
            console.log(e);
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
    robot.respond(/img\s?(compress)? t:([a-z|A-Z]+) ([\d\D]*)$/,(res)=>{
        console.log('img translate',res.match[0]);
        res.reply("图片生成中！");
        // hubot-test: img t:javascript function(){let a = 222; }
        const isConnectTinyBear = res.match[1];
        let prepareToWrite = res.match[3],
            fileExt,
            fileParser,
            fileName = 'temp_'+stringHash(prepareToWrite);
        [fileExt,fileParser] = getFileExt(res.match[2]);
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
            prepareToWrite = res.match[3];
        }
        
        fs.writeFileSync(TEMP_PATH + '/' + fileName + fileExt, prepareToWrite, {
            flag: 'w'
        });
        let child_carbon = carbonFunc(fileName + fileExt,fileName,TEMP_PATH);
        child_carbon.on('exit',function(code){
            console.log('exit:'+code);
            if(code === 0){
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
                    let isFinishReply = false;
                    const emitReplyImg = (res,result)=>{
                        robot.emit('bearychat.attachment', {
                            message: res.message,
                            text: 'CodeFormatter IMG',
                            attachments: [
                                {
                                    images: [
                                        { url: result.data.data.url },
                                    ]
                                }]
                        })
                    }
                    if(isConnectTinyBear === 'compress'){
                        let userList = bearyChatTools.checkUserList();
                        res.send("开始感应对接机器人的气息，开始寻找 TinyBear");
                        userList.then(data=>{
                            data.forEach(member=>{
                                // console.log(member.full_name);
                                if(member.full_name === "TinyBear" || member.name === "TinyBear"){
                                    console.log(member);
                                    res.reply("@<="+member.id+"=> "+result.data.data.url);
                                    isFinishReply = true;
                                }
                            })
                            if(!isFinishReply){
                                emitReplyImg(res,result);
                            }
                        });
                    }else{
                        emitReplyImg(res,result);
                    }
                    
                    // res.reply(`![code](${result.data.data.url})`);
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
    // robot.respond(/img\s?test$/,(res)=>{
    //     let userList = bearyChatTools.checkUserList();
    //     res.send("开始感应对接机器人的气息，开始寻找 TinyBear");
    //     userList.then(data=>{
    //         data.forEach(member=>{
    //             // console.log(member.full_name);
    //             if(member.full_name === "TinyBear" || member.name === "TinyBear"){
    //                 console.log(member);
    //                 res.reply("@<="+member.id+"=> https://i.loli.net/2018/10/31/5bd9606d9a78c.png");
    //             }
    //         })
    //     })
    // })
    robot.respond(/(today|tomorrow)$/,(res)=>{
        let todayCalendar;
        switch(res.match[1]){
            case 'today':
            todayCalendar = getProgrammerCalendar(new Date());
            break;
            case 'tomorrow':
            let tomorrow = new Date();
            tomorrow.setTime(tomorrow.getTime()+24*60*60*1000);
            todayCalendar = getProgrammerCalendar(tomorrow);
            break;
        }
        
        let good = '',bad = '';
        todayCalendar.good.forEach(item=>{
            good+=`**${item.name}** ${item.good}\n`;
        });
        todayCalendar.bad.forEach(item=>{
            bad+=`**${item.name}** ${item.bad}\n`;
        });
        robot.emit('bearychat.attachment', {
            message: res.message,
            text: todayCalendar.date,
            attachments: [
                {
                    color: '#ffee44',
                    text: "**今日宜：**",
                },
                {
                    color: '#ffee44',
                    text: good,
                },
                {
                    color: '#ff4444',
                    text: "**今日不宜：**",
                },
                {
                    color: '#ff4444',
                    text: bad,
                },{
                    text: `**座位朝向：** 面向${todayCalendar.directions}写程序，BUG最少`
                },{
                    text: `**今日宜饮：** ${todayCalendar.todayDrink}`
                }
                ]
        });
    })
    robot.respond(/api\-history$/,(res)=>{
        let vchannel_id,text,attachments;

        vchannel_id = res.message.room.vchannelId;

        let data = bearyChatTools.sendFile(vchannel_id);
        data.then(data=>{
            let result = [],resultData = '查询最近api信息为：';
            let apiCatch = /api:\s?(\S*) method:\s?(get|post)/;
            data.messages.forEach(messageItem=>{
                if(/api:/.test(messageItem.text) && !/api:API地址/.test(messageItem.text)){
                    let isCatch = apiCatch.exec(messageItem.text);
                    if(!isCatch){
                        return;
                    }
                    let [apiURL,apiMethod] = isCatch.slice(1,3);
                    messageItem.apiURL = apiURL.trim();
                    messageItem.apiMethod = apiMethod.trim();
                    result.push(messageItem);
                }
            });
            if(result.length === 0){
                res.send(resultData+"无");
            }else{
                res.send(result.reduce((messageString,messageItem,index)=>{
                    messageString += `\n${index+1}. \[${messageItem.apiMethod}\][${messageItem.apiURL}](${messageItem.apiURL})`;
                    return messageString;
                },resultData));
            }
        })
    })
    const helpText = `用法列表：
1. 输入 {JSON数据} 将会自动返回格式化的JSON数据
2. 输入 <XML数据> 将会自动返回格式化的XML数据
3. @bot tx {JSON数据} 转换JSON数据为XML数据返回
4. @bot tj <XML数据> 转换XML数据为JSON数据返回
5. @bot t:语言 代码片段
6. @bot img t:语言 代码片段
7. @bot img compress t:语言 代码片段
    * 将通过TinyBear机器人生成压缩后图片（需要讨论组中有TinyBear并处于正常运行状态）
8. @bot img clear 清除服务器缓存（将删除过往图片）
9. @bot api:API地址 method:get/post 数据
10. @bot api-history 获取最近100条消息内的api请求记录
11. @bot today|tomorrow 将获取对应日期的老黄历`
    robot.respond(/\-?\-?help$/,(res)=>{
        res.send(helpText);
    })
    robot.respond(/\-h$/,(res)=>{
        res.send(helpText);
    })
    // robot.listen((message)=>{
    //     console.log(message);
    //     if(message.text){
    //         console.log(message.text);
    //     }
    // },(res)=>{
    //     // console.log(res.match);
    // })
    // robot.error((err,res)=>{
    //     if(res){
    //         res.reply("DOES NOT COMPUTE");
    //     }
    // })
}