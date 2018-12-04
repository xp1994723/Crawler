/*
    mmjpg禁止爬虫访问，无法爬取，单程序绝对是能工作的

 */

//导入模块
const superagent = require("superagent")    //请求网页
const cheerio = require("cheerio")  //解析网页
const fs = require("fs")    //文件操作
const path = require("path")    //请求路径
const format = require("date-format")
const async = require("async")
const request = require("request")

class Reptile {

    //请求10页数据
    getDatePageMore(url, header) {
        const that = this
        //将10页数据储存起来
        const dataPage = []
        let page = 2
        const timerID = setInterval(() => {
            let urlPage = url + page
            if (page === 3) {
                //清除定时器
                clearInterval(timerID)
                //创建文件夹
                const file = path.join(__dirname, "mmjpg")
                const exists = fs.existsSync(file)
                //判断是否创建了文件夹
                if (!exists) {  //如果没有创建就创建
                    fs.mkdirSync(file)
                }
                //获取链接里面的数据
                that.getDatePage(dataPage[0], 10)
            }
            let data = that.requestDateFromBom(urlPage, header)
            dataPage.push(data)
            console.log(`第${page}页,链接爬取成功`)
            page++
        }, 1000)

    }

    //获取每个链接中地数据
    getDatePage(data, limit) {
        const that = this
        async.mapLimit(data, limit, (items, callback) => {
            setTimeout(() => {
                let title = items.title
                let addr = items.addr
                //创建子文件夹
                const file = path.join(__dirname, `mmjpg/${title}.jpg`)
                that.downloadImg(addr, file)
                callback(null, items, function () {
                    console.log(`${title}下载成功`);
                })
            }, 100)
        })

    }


    //模拟浏览器请求网址首页链接
    requestDateFromBom(url, header) {
        const that = this
        //定义一个空数组存储数据链接
        const data = []
        superagent
            .get(url)
            .set(header)
            .end((err, res) => {
                if (err || !res) {
                    console.log("请求地址不存在");
                    return
                } else {
                    //拿到的响应体用cherrio解析
                    const $ = cheerio.load(res.text)

                    //遍历res里面的响应的网页数据，找到想要的数据结构
                    $(".main .pic ul li").each((index, ele) => {
                        const title = format.asString('yyyyMMddhhmmss', new Date())
                        const addr = $(ele).children("a").children("img").attr("src")
                        data.push({
                            title,
                            addr
                        })
                    })
                    if (data.length <= 0) {
                        console.log("数据抓取失败");
                        return
                    }
                }
            })
        return data
    }

    //下载图片
    downloadImg(url, filename, callback) {
        request({uri: url, encoding: 'binary'}, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (!body) console.log("(╥╯^╰╥)哎呀没有内容。。。")
                fs.writeFile(filename, body, 'binary', function (err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('o(*￣▽￣*)o偷偷下载' + filename + ' done');
                });
            }
        })

    }

}

//创建实例
const reptile = new Reptile()

const url = "http://www.mmjpg.com/home/"
const header = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
}
//执行获取链接地址的方法
//获取10页数据
reptile.getDatePageMore(url,header)
