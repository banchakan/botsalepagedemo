
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    sendMessage(req.body)
    res.json(200)
})
app.listen(port)

function sendMessage(bodyResponse){
    const msg = getMessage();
    request.post({
        url: LINE_MESSAGING_API,
        headers: LINE_HEADER,
        body: JSON.stringify({
                replyToken: bodyResponse.events[0].replyToken,
                messages: [msg]
            })
    }, (err, res, body) => {
        console.log('status = ', res.statusCode);
    });
}

function getMessage() {
    return {
        "type": "flex",
        "altText": "New Order",
        "contents": {
          "type": "bubble",
          "direction": "ltr",
          "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "Purchase",
                "size": "lg",
                "align": "start",
                "gravity": "center",
                "weight": "bold",
                "color": "#3FB81A"
              },
              {
                "type": "text",
                "text": "฿ 100.00",
                "size": "3xl",
                "weight": "bold",
                "color": "#000000"
              },
              {
                "type": "text",
                "text": "Order No. OD-0001",
                "size": "sm",
                "weight": "bold",
                "color": "#000000"
              },
              {
                "type": "text",
                "text": "2020.05.08 22:30 (GMT+0700)",
                "size": "xxs",
                "weight": "regular",
                "color": "#949494"
              }
            ]
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "margin": "none",
            "contents": [
              {
                "type": "image",
                "url": "https://aowtakiabseafood.com/wp-content/uploads/2018/04/aowtakiab-feature.jpg",
                "margin": "none",
                "align": "start",
                "size": "full",
                "aspectRatio": "4:3",
                "aspectMode": "fit"
              }
            ]
          }
        }
      }
}




