
const express = require('express')
//const axios = request('axios')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000

const db = mysql.createConnection({
    host: '49.0.72.5',
    port: '3307',
    user: 'root',
    password: 'admin1234',
    database: 'sale_page'
})

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
}

db.connect()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    checkUserType(req.body.events[0].source, req.body)
    //sendMessage(req.body)
    res.json(200)
})
app.listen(port)

async function checkUserType(sources , bodys){
    let body = {
        events: [
            {
              replyToken: "tk-4563215251254526315",
              type: "message",
              timestamp: "1522224523",
              source: {
                type: "user",
                userId: "11111111111111"
              },
              message: {
                id: "9554521",
                type: "text",
                text: "Hello, world"
              }
            }
          ]
    }
    let source = {
        type: 'user',
        userId: '11111111111111'
    }
    
    if(source.type === 'user'){
        
        let new_msg_log = {
            fullLog: '',
            text: '',
            ctmId: '',
            shopId:  1000,
            type_msg: 1
        }

        qyeryCustomerIdentifier(source.userId).then(res=> {
            if(!res){
                //พบ
            }else{
                insertCustomer(source.userId).then(res => {
                    if(res){
                        //insert ok
                        console.log(res)
                        new_msg_log.ctmId = source.userId
                        new_msg_log.fullLog = JSON.stringify(body)
                        new_msg_log.text = JSON.stringify(body.events[0].message)
                        // insertMessageLog(new_msg_log).then(log_res => {
                        //     if(res){
                        //         console.log(log_res)
                        //     }else{
                        //         //error
                        //         console.log("Error")
                        //     }
                        // })
                    }else{
                        //error
                    }
                })
            }
        })    
    }else{

    }
}

function qyeryCustomerIdentifier(id){
    return new Promise((resolve,reject) => {
        let sql = `select * from customer as c where c.customer_identifier = '${id}'`
        db.query(sql, function (error, results){
            //db.end()
            if (error) {
                 reject(null)
            } else {
                 resolve(results[0])
            }
        })
    })
}

function insertCustomer(id){
    return new Promise((resolve,reject) => {
        let sql = `insert into customer(customer_fullname, customer_identifier, shop_id) values('voy', '${id}', 1000)`
        db.query(sql, function (error, results){
            if(error){
                reject(null)
            }else{
                resolve(results)
            }
        })
    })
}

function insertMessageLog(new_msg_log){
    return new Promise((resolve,reject) => {
        //let sql = `insert into msg_log(msg_text, msg_full_log, customer_id, shop_id, msg_type_id) values('${new_msg_log.text}', '${new_msg_log.fullLog}', ${new_msg_log.ctmId}, ${new_msg_log.shopId}, ${new_msg_log.type_msg})`
        let sql = `insert into msg_log(msg_text, msg_full_log, customer_id, shop_id, msg_type_id) values('text1', 'text2', ${new_msg_log.ctmId}, ${new_msg_log.shopId}, ${new_msg_log.type_msg})`
        db.query(sql, function (error, results){
            if(error){
                console.log(error)
                reject(null)
            }else{
                console.log(results)
                resolve(results)
            }
        })
    })
}

function sendMessage(bodyResponse){
    request.post({
        url: LINE_MESSAGING_API,
        headers: LINE_HEADER,
        body: JSON.stringify({
                replyToken: bodyResponse.events[0].replyToken,
                messages: [{
                    type: `text`,
                    text: JSON.stringify(bodyResponse)
                }]
            })
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}


