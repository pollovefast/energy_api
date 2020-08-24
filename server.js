const express = require('express');
const bodyPaser = require('body-parser');
const mongoose = require('mongoose');
const port = 2000;
const File = require('./File')
const app = express();
const cors = require('cors');
const server = require('http').Server(app)
const io = require('socket.io')(server);
// var io = socket(server);

var option = {
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    useNewUrlParser: true,
    auto_reconnect: true,
    useUnifiedTopology: true
}

app.use(cors());

app.use(function(req,res,next) {
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    next();
})

app.use(bodyPaser.json());
app.use(bodyPaser.urlencoded({extended: false}));

mongoose.connect('mongodb://127.0.0.1:27017/ploy',option, ()=>{
    console.log('connect to mongodb')
})

io.on('connection',function (socket){

    File.findOne({},{},{sort: {'create': -1}},function(err,result){
        if (result.length < 1 || err) {
            socket.emit('energy', {success: true,msg: 'no data'});
        }else{
            socket.emit('energy', {success: true,data: result})
        }
    })

    socket.on('disconnect',function (){
        console.log('dis')
    })

})

app.get('/test', function(req,res){
    console.log("5555")
    res.sendfile('index.html')
})

app.get('/data', function(req,res) {
    File.find({},{},{sort: {'create': -1}}, function(err,result){
        res.status(201).send({
            result: result
        })
        console.log('show data')
    }).catch(err => {
        res.status(400).send({
            msg: "no data or type not support"
        })
    })
})

app.post('/data',(req,res)=>{

    var request_data = req.body;
    var count = Object.keys(req.body).length;

    if (count != 0) {
        if (request_data) {
            new File({
                building: request_data.building,
                result: request_data.result,
                create: new Date()
            }).save().then(() => {
                File.findOne({},{},{sort: {'create': -1}},function(err,result){
                    if (result.length < 1 || err) {
                        io.sockets.emit('energy', {success: true,msg: 'no data'});
                        res.send({success: true})
                    }else{
                        io.sockets.emit('energy', {success: true,data: result})
                        res.send({success: true})
                    }
                })
            }).catch(err => {
                res.status(400).send({
                    msg: err
                })
            })
        } else {
            res.status(400).send({
                success: false,
                msg: 'bad_request',
                detail: 'result not found'
            })
        }
    } else {
        res.status(400).send({
            success: false,
            msg: 'bad_request',
            detail: 'no body or type not support'
        })
    }
})

server.listen(port,function(req,res){
    console.log("connect port 2000")
})