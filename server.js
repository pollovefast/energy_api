const express = require('express');
const bodyPaser = require('body-parser');
const mongoose = require('mongoose');
const port = 2000;
const FileSchema = require('./File')
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

// mongoose.connect('mongodb+srv://patinya:8273083743@cluster0.pvjq7.gcp.mongodb.net/energy-power',option, ()=>{
//     console.log('connect to mongodb')
// })

io.on('connection',function (socket){

    const CPE = mongoose.model('CPE', FileSchema);
    const EE = mongoose.model('EE', FileSchema);
    const EN = mongoose.model('EN',FileSchema);

    EN.findOne({},{},{sort: {'create': -1}},function(err,result){
        if (result.length < 1 || err) {
            socket.emit('EN',{success: true,msg: 'no data'})
        } else {
            socket.emit('EN',{success: true,data: result})
        }
    })

    CPE.findOne({},{},{sort: {'create': -1}},function(err,result){
        if (result.length < 1 || err) {
            socket.emit('CPE', {success: true,msg: 'no data'});
        }else{
            socket.emit('CPE', {success: true,data: result})
        }
    })

    EE.findOne({},{},{sort: {'create': -1}}, function(err,result){
        if (result.length < 1 || err) {
            socket.emit('EE',{success: true,msg: "no data"})
        } else {
            socket.emit('EE',{success: true,data: result})
        }
    })

    socket.on('disconnect',function (){
        console.log('dis')
    })

})

app.get('/', function(req,res){
    res.sendfile('index.html')
})

app.post('/test', function(req,res){
    var ress = req.body.date
    const File = mongoose.model(req.body.building, FileSchema);
    File.findOne({},{},{sort: {'create': -1}}, function(err,result){
        if (ress == "2020-08-27T16:22:35.187Z") {
            res.send(result)
        } else {    
            res.send("555")
        }
        // res.status(200).send(result)
    }).catch(err => {
        res.status(400).send({
            msg: "no data or type not support"
            
        })
    })
})

app.get('/data', function(req,res) {

    const File = mongoose.model(req.body.building, FileSchema);

    File.find({},{},{sort: {'create': -1}}, function(err,result){
        res.status(200).send(result)
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

    const File = mongoose.model(request_data.building, FileSchema);

    if (count != 0) {
        if (request_data) {
            new File({
                building: request_data.building,
                result: request_data.result,
                create: new Date()
            }).save().then(() => {
                File.findOne({},{},{sort: {'create': -1}},function(err,result){
                    if (result.length < 1 || err) {
                        io.sockets.emit(request_data.building, {success: true,msg: 'no data'});
                        res.send({success: true})
                    }else{
                        io.sockets.emit(request_data.building, {success: true,data: result})
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