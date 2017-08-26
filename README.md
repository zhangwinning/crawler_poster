大家好我是曲灵风，前段时间一直在网上找电影看，直到朋友推荐了一个挺不错的[电影网站](http://dianying.fm/search)，用了一下，哎呦，还真不错，网站的排版，分类，壁纸是真的可以(有点跑偏，快成了介绍电影网站的博客了，那就拉回来)。如果把这些电影图片捞出来，组成一个形状是不是挺有意思的，这个还真不清楚，既然不清楚，那就先试试。

最后试了一下，没成想还可以，做了一个可以定制特定海报大小的东东，在命令行中输入下面的命令(代码的执行需要Node环境的，假设你的Node环境已经装好)，就会生成一张组合图像(如下图`theLastOne.jpg `)
```js 
node index.js 10 7 10
```

![theLastOne.jpg](http://upload-images.jianshu.io/upload_images/5648502-13ac4cb3fa5ed219.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

[源码位置](https://github.com/WenNingZhang/crawler_poster)

接下来依据代码分析一下的实现逻辑。

各位看官，要想实现上面图像的组合，实现两个功能就行：
 1. 实现爬虫程序，把图片从网页中捞出来，保存到本地。
2. 通过某种特定算法，把图片重新组合，最后生成一张特定图片。

这里主要的逻辑是在第二步,爬虫程序简单说一下。

````js
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const async = require('async');
const arrange = require('./arrange');
const log4js = require('log4js').getLogger("begin crawler");

let loveURL = "http://dianying.fm/search/?genre=%E7%88%B1%E6%83%85&p=";

// 根据图片url下载图片
let download = function (uri, filename, cb) {
    request.head(uri, function (err, res, body) {
        request(uri, {
            sendImmediately: false
        }).pipe(fs.createWriteStream(filename)).on('close', cb);
    });
};

// 从拉取的html中把src取出来
let getSrc = function (body) {
    let $ = cheerio.load(body);
    let list = [];
    $('ul[class="fm-result-list"]').find('li > div > a > img').each(function (index, element) {
        list.push($(element).attr('src'));
    })
    return list;
}

// 获取`爬虫爬取的图片在本地的保存位置`。
let getPosterPath = function (src) {
    let postersDir = path.join(__dirname, 'source');
    let fileName = src.split('/')[src.split('/').length - 1].split('-')[0];
    let posterPath = path.join(postersDir, fileName);
    return posterPath;
}

let begin = () => {
    let downLoads = 0;
    if (!process.argv[2] && !process.argv[3] && !process.argv[4]) {
        log4js.warn(`请从命令行中输入页数,宽度, 高度 forExample: node dingying.js 3 4 5 `);
        process.exit(0);
    }
    let pages = process.argv[2];
    let loop = new Array(parseInt(pages));      //设置要循环的次数;

    async.eachOfLimit(loop, 2, (page, index, cbPage) => {
        request(loveURL + (index + 1), function (error, response, body) {
            let list = getSrc(body);
            async.eachSeries(list, (src, cbSrc) => {
                log4js.info(src, "start ...");
                let posterPath = getPosterPath(src)
                download(src, posterPath, function (err) {
                    if (err) log4js.error(err);
                    downLoads++;
                    return cbSrc();
                });
            }, (err) => {
                return cbPage();
            });
        });
    }, (err) => {
        log4js.info("downLoads url total: ", downLoads);
        arrange.arrange(process.argv[3], process.argv[4], (err, info) => {
            if (err) console.error(err, info);
            setTimeout(function () {
                log4js.info("finish: success");
                process.exit();
            }, 2000);
        });
    });
}

begin();
 
````
1. 开始几行是通过requrie()引进依赖库。
2. 定义变量`loveURL `，这个url其实就是网页的URL，通过网页的URL获取图片地址。
3. download()方法根据src从web上下载图片，最后通过可写流写入相应文件中。其中`pipe`是管道，它的流向是从可读流到可写流。其中`.on`是写入成功之后，流会调用`close`事件，从而调用回调函数。
4. 


老规矩来一个老郭的定场诗振奋一下。

```
大将生来胆气豪 腰横秋水雁翎刀 
风吹鼍鼓山河动 电闪旌旗日月高 
天上麒麟原有种 穴中蝼蚁岂能逃 
太平待诏归来日 朕与将军解战袍
```