/**
 * Created by Administrator on 2018/2/10.
 */
const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const winston = require('winston');

const LOGGER = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf(function (info) {
        return info.timestamp + ' ' + info.level + ' : ' + JSON.stringify(info.message);
    })),
    transports: [
        new winston.transports.Console({level: 'debug'}),
        new winston.transports.File({filename: 'logs/debug.log', level: 'debug'}),
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: 'logs/exceptions.log'})
    ]
});
const HOST = 'http://www.dytt8.net';
const URL = 'http://www.dytt8.net/html/gndy/dyzz/index.html';
const BASE_ITEM_URL = 'http://www.dytt8.net/html/gndy/dyzz/';
const DATA_FILE = new store('data/data.txt');
const ORIGINAL_DATA_FILE = new store('data/original-data.txt');

var CURRENT_PAGE_URL = URL;
start();

function start() {
    grabMovieItems(CURRENT_PAGE_URL);
}

/**
 * 爬取电影条目
 * @param url
 */
function grabMovieItems(url) {
    http.get(url, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
            var $ = cheerio.load(html, {decodeEntities: false});
            $('.co_content8 table a').each(function (index, target) {
                // 爬取每个item的详细信息
                var detailUrl = $(target).attr('href');
                LOGGER.debug('handle ' + detailUrl);
                grabMovieDetail(HOST + detailUrl);
            });

            $('.co_content8 .x a').each(function (index, target) {
                // 爬取下一页的URL
                var $target = $(target);
                var text = $target.text();
                if (text == '下一页') {
                    var nextURL = $target.attr('href');
                    CURRENT_PAGE_URL = BASE_ITEM_URL + nextURL;
                    // 爬取下一页
                    LOGGER.debug('got to next page ' + nextURL);
                    grabMovieItems(CURRENT_PAGE_URL);
                }
            });
        });
    }).on("error", function (e) {
        LOGGER.error(e.message);
        grabMovieItems(CURRENT_PAGE_URL);
    });
}

/**
 * 爬取电影详细信息
 * @param url
 */
function grabMovieDetail(url) {
    http.get(url, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });
        res.on('end', function () {
            var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
            var $ = cheerio.load(html, {decodeEntities: false});
            var article = $('#Zoom').text();
            ORIGINAL_DATA_FILE.writeln(removeLine(article));
            DATA_FILE.writeln(JSON.stringify(parserArticle(article)));
        });
    }).on("error", function (e) {
        LOGGER.error(e.message);
    });
}

/**
 * 解析文章获取格式化的电影详情
 * @param article
 */
function parserArticle(article) {
    var index = article.indexOf('◎'), detail = {};
    while (index != -1) {
        var next = article.indexOf('◎', index + 1);
        switch (article.substr(index + 1, 4)) {
            case '译　　名':
                detail.tname = article.substring(index + 5, next).trim();
                break;
            case '片　　名':
                detail.name = article.substring(index + 5, next).trim();
                break;
            case '年　　代':
                detail.year = article.substring(index + 5, next).trim();
                break;
            case '产　　地':
                detail.country = article.substring(index + 5, next).trim();
                break;
            case '类　　别':
                detail.type = article.substring(index + 5, next).trim();
                break;
            case '语　　言':
                detail.language = article.substring(index + 5, next).trim();
                break;
            case '字　　幕':

                break;
            case '豆瓣评分':
                detail.score = article.substring(index + 5, next).trim();
                break;
            case '导　　演':
                detail.director = constructName(article.substring(index + 5, next).trim());
                break;
            case '主　　演':
                detail.actor = extractActors(article.substring(index + 5, next).trim());
                break;
        }

        index = next;
    }
    // console.log(detail);
    return detail;
}

/**
 * 演员提取
 * @param str
 * @returns {Array}
 */
function extractActors(str) {
    // 切分字符串，因为空格不固定不能直接使用split函数
    var actors = [], spacenum = 0, begin = 0;
    for (var i in str) {
        var c = str.charAt(i);
        if (c == ' ' || c == '\t' || c == '\n' || c == '　') {
            spacenum++;
        } else {
            if (i != 0 && spacenum > 1) {
                actors.push(str.substring(begin, i - spacenum));
                begin = i;
            }
            spacenum = 0;
        }
    }
    var result = [];
    for (var i in actors) {
        result.push(constructName(actors[i]));
    }
    return result;
}

/**
 * 姓名提取
 * @param str
 * @returns {{zh_name: string, en_name: string}}
 */
function constructName(str) {
    var i = str.indexOf(' ');
    return {
        zh_name: str.substring(0, i),
        en_name: str.substring(i + 1)
    }
}

/**
 * 移除换行符
 * @param str
 */
function removeLine(str) {
    return str.replace(/\n/g, '');
}

/**
 * 存储对象
 * @param file
 */
function store(file) {
    this.fd = null;
    this.file = file;
}

/**
 * 写入文本数据
 * @param text
 */
store.prototype.writeln = function (text) {
    if (this.fd) {
        fs.write(this.fd, text + '\n', function (err) {
            if (err) {
                LOGGER.error(err);
            }
        });
    } else {
        var that = this;
        fs.open(that.file, "a", function (err, fd) {
            if (err) {
                LOGGER.error(err.message);
            } else {
                that.fd = fd;
                that.writeln(text);
            }
        });
    }
}


