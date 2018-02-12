/**
 * Created by Administrator on 2018/2/10.
 */

var detail = {
    tname: '',
    name: '',
    year: '',
    country: '',
    type: '',
    language: '',
    score: '',
    director: '',
    actor: []
}

function parserArticle(article) {
    var index = 0, detail = {};
    while ((index=article.indexOf('◎')) != -1) {
        var next = article.indexOf('◎');
        if(next==-1){
            break;
        }
        switch (article.substring(i + 1, 4)) {
            case '译　　名':
                console.log(article.substring(i+4,next));
                break;
            case '片　　名':
                console.log(article.substring(i+4,next));
                break;
            case '年　　代':
                console.log(article.substring(i+4,next));
                break;
            case '产　　地':
                console.log(article.substring(i+4,next));
                break;
            case '类　　别':
                console.log(article.substring(i+4,next));
                break;
            case '语　　言':
                console.log(article.substring(i+4,next));
                break;
            case '字　　幕':
                console.log(article.substring(i+4,next));
                break;
            case 'IMDb评分':
                console.log(article.substring(i+4,next));
                break;
            case '豆瓣评分':
                console.log(article.substring(i+4,next));
                break;
            case '导　　演':
                console.log(article.substring(i+4,next));
                break;
            case '主　　演':
                console.log(article.substring(i+4,next));
                break;
        }

    }
}