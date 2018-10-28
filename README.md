# CodeFormatter

## usage
1. format your json fragment to markdown code fragment.
> input json data

![](https://s1.ax1x.com/2018/10/24/isw4fJ.png)

2. format code by Prettier 
> @bot t:语言(markdown) 代码 

![](https://s1.ax1x.com/2018/10/24/iswIp9.png)

3. get api res and format then(support get/post method)
> @bot api:完整 API 地址(url) method:get/post 发送数据体(json data)

![](https://s1.ax1x.com/2018/10/24/is0Mn0.png)

4. generate code picture by carbon
> @bot img t:语言 代码片段

5. about server temp data
    1. clear temp data and pic data
        > @bot img clear

## install 
```
1. git clone https://github.com/thewindsword/CodeFormatterHubot.git
2. yarn install 
   or 
   npm install
3. export HUBOT_BEARYCHAT_TOKENS=<your token>
4. ./bin/hubot -a bearychat
```