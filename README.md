大家好我是曲灵风，前段时间一直在网上找电影看，直到朋友推荐了一个挺不错的[电影网站](http://dianying.fm/search)，用了一下，哎呦，还真不错，网站的排版，分类，壁纸是真的可以(有点跑偏，快成了介绍电影网站的博客了，那就拉回来)。那时一想如果把这些电影图片捞出来，组成一个形状是不是特有意思的？这个还真不清楚，既然不清楚，那就先试试。

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
3. download()方法根据src下载图片，最后通过可写流写入相应文件中。其中`pipe`是管道，它的流向是从可读流到可写流，`.on('close', cb)`是绑定close函数，写入成功之后，调用回调函数。
4. getSrc()是爬虫的主要逻辑，其中主要是`cheerio`模块的使用，这里有[小例子](https://stackoverflow.com/questions/32655076/cheerio-jquery-selectors-how-to-get-a-list-of-elements-in-nested-divs/)可以帮助理解`cheerio `是如何在网页中捞元素的。
5. getPosterPath是获取图片在本地的保存位置。
6. begin()是程序的入口函数，在`arrange.arrange`函数调用之前都是爬虫程序，是通过`node index.js 10 7 10`这个命令行中的第一个10来确定把10个html(其中每个html网页是15张图片，总共150张图片)网页捞到本地来，然后异步方式下载图片，保存到本地目录。

接下来看一下`arrange.arrange`函数的实现逻辑，也就是第二个功能的实现。
```js
const gm = require('gm');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const rimraf = require('rimraf');
let source = fs.readdirSync('./source');

exports.arrange = (width, height, cb) => {
    //先清空`destination`目录
    rimraf('./destination/*', function () {
        let groups = _.chunk(source, width);  //width是宽度, groups.length是实际的高度

        let formatGroups = groups.slice(0, height);

        async.eachOfLimit(formatGroups, 2, (group, index, cbGroup) => {
            var gmstate = gm('./source/' + group[0]);
            for (let j = 1; j < group.length; j++) {
                gmstate.append('./source/' + group[j], true);
            }
            gmstate.write('./destination/' + (index + 10000) + ".jpg", function (err) {
                if (err) {
                    console.dir(arguments);
                    return cb(err);
                }
                console.log(this.outname + " created  ::  " + arguments[3])
                return cbGroup();
            });
        }, (err) => {
            setTimeout(function () {
                let integrations = fs.readdirSync('./destination');
                let gmstateDes = gm('./destination/' + integrations[0]);
                for (let i = 1; i < integrations.length; i++) {
                    gmstateDes.append('./destination/' + integrations[i]);
                }
                gmstateDes.write('./destination/' + "theLastOne.jpg", function (err) {
                    if (err) {
                        console.dir(arguments);
                        return cb(err);
                    }
                    console.log(this.outname + " created  ::  " + arguments[3]);
                    return cb(null, 'finish');
                });
            }, 2000);
        });
    });
}
```
1. 引进依赖库。
2. 函数`exports.arrange(width, height, cb)`的作用是通过指定宽度，高度生成特定大小的图片。
   - 清空`destination `目录，目的是保证每次组合图片的准确性。
   - 根据新图片宽度的大小进行分组，获取`groups `变量。
   - 如果变量`height `大于`groups `长度，取`height `作为目标图片的高度，否则取`groups `长度作为目标图片的高度,这是formatGroups变量的作用。
   -  组合图片
      - gmstate.append()函数的第二个参数默认是false，标明是从上到下组合图片，true是从左到右组合图片。
      - 先把每组相应图片从左到右进行组合，这是`gmstate `变量的作用，每组组合成功后，写入到相应文件中。
      - 因为这里有多次磁盘读写操作，即使是异步执行，磁盘更新也不会太及时，因此需要`setTimeout()`来使程序执行放慢速度。
      - 最后把生成的长条图片上下组合(`gmstateDes `变量的作用)。

最后再来测试一下，执行`node index.js 1 3 4`，说明需要拉取1个网页，其中组合的新图片长度是3，高度是4。看一下`newOne.jpg `的大小, bingo搞定!!!

```
node index.js 1 3 4
```

![newOne.jpg](http://upload-images.jianshu.io/upload_images/5648502-c0cfb34943e7ee1c.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

其实这里的图片大多是爱情片的海报，快七夕了，应应景就好。

老规矩最后来一个老郭的定场诗。

```
大将生来胆气豪 腰横秋水雁翎刀 
风吹鼍鼓山河动 电闪旌旗日月高 
天上麒麟原有种 穴中蝼蚁岂能逃 
太平待诏归来日 朕与将军解战袍
```