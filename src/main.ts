import * as querystring from 'querystring';
import md5 = require('md5');
import {IncomingMessage} from 'http';
import {appId, appSecret} from './private';

const https = require('node:https');

export const translate = (word: string) => {
    const salt = Math.random();
    const sign = md5(appId + word + salt + appSecret);
    let from, to;

    if (/[a-zA-Z]/.test(word[0])) {
        from = 'en';
        to = 'zh';
    } else {
        from = 'zh';
        to = 'en';
    }

    const query: string = querystring.stringify({
        q: word, appid: appId, from, to, salt, sign
    });

    type ErrorMap={
        [k:string]: string
    }
    const errorMap:ErrorMap = {
        52003: '用户认证失败',
        58001: '不支持该语言',
        54000: '请输入内容',
        54001: '签名错误 ',
        54004: ' 账户余额不足',
    };

    const options = {
        hostname: 'api.fanyi.baidu.com',
        port: 443,
        path: '/api/trans/vip/translate?' + query,
        method: 'GET'
    };

    const request = https.request(options, (response: IncomingMessage) => {
        const array: Buffer[] = [];
        response.on('data', (chunk) => {
            array.push(chunk);
        });
        response.on('end', () => {
            type BaiduResult = {
                error_code?: string;
                error_msg?: string;
                from: string
                to: string
                trans_result: { src: string; dst: string }[]
            }
            const body: BaiduResult = JSON.parse(Buffer.concat(array).toString());
            if (body.error_code) {
                console.log(errorMap[body.error_code] || body.error_msg);
                process.exit(2);
            } else {
                console.log(body.trans_result[0].dst);
                process.exit(0);
            }
        });
    });

    request.on('error', (e: Error) => {
        console.error(e);
    });
    request.end();
};