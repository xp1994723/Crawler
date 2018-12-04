/*
    nodeJS爬虫实践

    唐诗宋词古诗文网https://www.gushiwen.org/gushi/tangshi.aspx
 */


///1.导入依赖包
const superagent = require("superagent")
const cheerio = require("cheerio")
const async = require("async")
const fs = require("fs")
const path = require("path")


class Crawler {
    /**
     * 获取首页所有的古诗词链接（可能会有遗漏）
     * superagent 官方文档https://www.npmjs.com/package/superagent
     */
    getAllLinks() {
        //请求网址,模拟浏览器
        superagent
        //带抓取的网页地址
            .get('https://www.gushiwen.org/gushi/tangshi.aspx')
            //设置响应头
            .set('accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8')
            //返回结果值
            .end((err,res) => {
                //判断是否正确拿到响应值
                if (err || !res) {
                    console.log('抓取失败');
                    return
                }
                //如果正确拿到响应体,用cheerio解析
                // console.log(res.text);
                const $ = cheerio.load(res.text)
                //定义一个数组将数据存储起来
                let data = []
                //遍历找到的数据
                $(".left .typecont span").each((key,ele)=>{
                    let title = $(ele).text()
                    let addr = $(ele).children('a').attr('href')
                    //对字符串进行处理
                    if (title.trim() && addr.trim()) {
                        data.push({
                            title,
                            addr
                        })
                    }
                })
                if (data.length>0) {

                    const dirPath = path.join(__dirname, "唐诗宋词")
                    const exists = fs.existsSync(dirPath)
                    if (!exists) {
                        fs.mkdirSync(dirPath)
                    }
                    this.getAsync(1,data)
                }
            })

    }

    /**
     * async  详情请参考官方文档https://www.npmjs.com/package/async
     * @param limit
     * @param data
     */
    getAsync(limit, data) {
        async.mapLimit(data,limit,(items,callback)=>{
            setTimeout(()=>{
                const title = items.title
                const addr = items.addr
                //定义当前文件路径
                let txtPath = path.join(__dirname, `唐诗宋词/${title}.txt`)
                superagent
                    .get(addr)
                    .set('accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8')
                    .end((err, res)=>{
                        const $ = cheerio.load(res.text)
                        const num = addr.split("_")[1].split(".")[0];
                        const id = `#contson${num}` //获取每个需要提取的内容的id
                        const text = $(id).text()
                        const str = text.replace(/。/g,"。\n") //在每句后面加换行
                        fs.writeFile(txtPath,str,err=>{
                            if (err) console.log("写入失败");
                            console.log(`${title}写入成功`);
                        })
                    })
                callback(null,items)
            },100)
        },(err,result)=>{
            if (err) throw err
            console.log(result);
        })
    }
}

const crawler = new Crawler()
crawler.getAllLinks()