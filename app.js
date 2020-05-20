const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')
const path = require('path')
const os = require('os')
const fs = require('fs')
const line = require('@line/bot-sdk');
const app = express()
const port = process.env.PORT || 4000

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}`
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/webhook', (req, res) => {
    //getContent('555', '11997242803572')
    if(req.body.events[0].message.type === 'image'){
        getContent(req.body.events[0].message.id)
    }else{
        let model = {
            type: 'text',
            text: 'กรุณาส่งรูปภาพเท่านั้น'
        }
        replyMessage(req.body.events[0].replyToken, model)
    }
    
    res.json(200)
})

app.listen(port)

function replyMessage(replyToken, jsonMessage){
    request.post({
        url: `${LINE_MESSAGING_API}/reply`,
        headers: LINE_HEADER,
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [jsonMessage]
        })
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

async function getContent(messageId){
    const config = {
        method: 'get',
        url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
        },
        encoding: null
    }
    let buffer = await axios(config)
    
    fs.writeFile('bank.jpg', buffer.data, function (err) {
        if (err) return console.log(err);
        console.log('buffer_data > bank.jpg');
    });
}


// const client = new line.Client({
    //     channelAccessToken: 'XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU='
    // });
    // let buffer = null
    // client.getMessageContent(`${messageId}`)
    // .then((stream) => {
    //     stream.on('data', (chunk) => {
    //         console.log("chunk => ", chunk)
    //         // buffer = `${buffer}${chunk}`
    //     });
    //     stream.on('error', (err) => {
    //         console.log("ERROR => ", err)
    //     });
    //     stream.on('finish', async (finish) =>{
    //         console.log("finish => ", finish)
    //         await fs.writeFileSync('test.jpg', finish);
    //     })
    // })























  

    // console.log('Headers => ', buffer.headers)
    // console.log('Config => ', buffer.config)
    // console.log('Request => ', buffer.request)
    // console.log("DATA => ", buffer.data)

    // let url = `https://api.line.me/v2/bot/message/${messageId}/content`

    // let buffer = await request.get({
    //     headers: {
    //         'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
    //     },
    //     uri: url,
    //     //encoding: null // แก้ปัญหา binary ไม่สมบูรณ์จาก default encoding ที่เป็น utf-8
    //   });

    //   console.log(buffer)

    // const tempLocalFile = path.join(os.tmpdir(), 'test.jpg');
    // 

    // var base64Data = buffer.data.replace(/^data:image\/png;base64,/, "");
    // fs.writeFileSync("new.jpg", base64Data, 'base64', function(err) {
    //     console.log(err);
    // });
