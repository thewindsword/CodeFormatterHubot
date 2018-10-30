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
        console.log("Array");
        body = simpleJson.slice(0,1).map(item => {
            simpleObj(item)
        });
    }else{
        console.log("Object");
        body = simpleObj(simpleJson);
    }
    return body;
}

function simpleObj(objectData){
    console.log('objectData:\n',JSON.stringify(objectData));
    let keys = Object.keys(objectData),result = {};

    keys.forEach(keyName=>{
        if(Array.isArray(objectData[keyName])){
            result[keyName] = objectData[keyName].slice(0,1);
        }else if(typeof objectData[keyName] === "object" && objectData[keyName] !== null){
            result[keyName] = "Object"
        }else{
            result[keyName] = objectData[keyName];
        }
    })
    console.log("result\n",JSON.stringify(result));
    return result;
}