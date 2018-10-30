module.exports = (body,res)=>{
    let simpleJson;
    res.reply("返回数据过多，简化中");
    try{
        simpleJson = body;
    }catch(parseE){
        res.reply("数据解析失败:"+parseE);
        return;
    }
    if(Array.isArray(simpleJson)){
        body = JSON.stringify(simpleJson.slice(0,1).map(item => {
            simpleObj(item)
        }));
    }else{
        body = JSON.stringify(simpleObj(simpleJson));
    }

    return body;
}

function simpleObj(objectData){
    let keys = Object.keys(objectData),result = {};

    keys.forEach(keyName=>{
        if(Array.isArray(objectData[keyName])){
            result[keys] = objectData[keyName].slice(0,1);
        }else if(typeof objectData[keyName] === "object" && objectData[keyName] !== null){
            result[keys] = "Object"
        }else{
            result[keys] = objectData[keyName];
        }
    })

    return result;
}