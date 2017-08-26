const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const async = require('async');
const arrange = require('./arrange');
const log4js = require('log4js').getLogger("begin crawler");

let postersDir = path.join(__dirname, 'source');

let loveURL = "http://dianying.fm/search/?genre=%E7%88%B1%E6%83%85&p=";

let download = function (uri, filename, cb) {
    request.head(uri, function (err, res, body) {
        request(uri, {
            sendImmediately: false
        }).pipe(fs.createWriteStream(filename)).on('close', cb);
    });
};


let begin = () => {
    let downLoads = 0;
    if (!process.argv[2] && !process.argv[3] && !process.argv[4]) {
        log4js.warn(`请从命令行中输入页数,宽度, 高度 forExample: node dingying.js 3 4 5 `);
        process.exit();
    }
    let pages = process.argv[2];
    let loop = new Array(parseInt(pages));      //设置要循环的次数;

    async.eachOfLimit(loop, 2, (page, index, cbPage) => {
        request(loveURL + (index + 7), function (error, response, body) {
            let $ = cheerio.load(body);
            let list = [];
            $('ul[class="fm-result-list"]').find('li > div > a > img').each(function (index, element) {
                list.push($(element).attr('src'));
            })
            async.eachSeries(list, (src, cbSrc) => {
                log4js.info(src, "start ...");
                let fileName = src.split('/')[src.split('/').length - 1].split('-')[0];
                let posterPath = path.join(postersDir, fileName);
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
            if (err) {
                console.error(err, info);
            }
            setTimeout(function () {
                log4js.info("finish: success");
                process.exit();
            }, 2000);
        });
    });
}

begin();

