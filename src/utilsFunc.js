
module.exports = {
    getFileExt: (data)=>{
        let fileExt,fileParser;
        switch(data){
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
        return [fileExt,fileParser]
    }
    
}