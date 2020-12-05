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

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    next();
})

app.use(bodyPaser.json());
app.use(bodyPaser.urlencoded({ extended: false }));

mongoose.connect('mongodb://127.0.0.1:27017/ploy', option, () => {
    console.log('connect to mongodb')
})

// mongoose.connect('mongodb+srv://patinya:8273083743@cluster0.pvjq7.gcp.mongodb.net/energy-power',option, ()=>{
//     console.log('connect to mongodb')
// })

io.on('connection', function (socket) {
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        for (const i of names) {
            const datas = mongoose.model(i.name, FileSchema)
            datas.findOne({}, {}, { sort: { 'create': -1 } }, function (err, result) {
                var nameda = i.name
                // var lengthda = nameda.length
                var res = nameda.toLowerCase()
                if (result.length < 1 || err) {
                    socket.emit(res, { success: true, msg: 'no data' })
                } else {
                    // console.log(result)
                    socket.emit(res, { success: true, data: result })
                }
            }).catch(err => {
                console.log("error")
            })
        }
    })

    socket.emit("test", { success: true })

    socket.on('disconnect', function () {
        console.log('dis')
    })

})

// app.post('/graph',function (req,res){
//     var request_data = req.body

// })

app.get('/', function (req, res) {
    // res.sendfile('index.html')
})

app.get('/building', function (req, res) {
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        var array = [];
        var num = 0;
        for (const i of names) {
            num = 0;
            var lenname = i.name.slice(0, i.name.length - 1)
            for (const iterator of array) {
                if (lenname.toUpperCase() == iterator.toUpperCase()) {
                    num = 1;
                    break;
                }
            }
            if (num == 0) {
                // console.log(i.name)
                array.push(lenname.toUpperCase())
            }
        }
        res.send(array)
    })
})

app.post('/history', function(req,res){
    var request_data = req.body
    if (request_data.length < -1) {
        res.send({
            msg: request_data
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block , FileSchema)
        console.log(request_data.building.toLowerCase() + request_data.block)
        datas.find({}, {}, {}, function (err, result) {
            var data = []
            // console.log()
            var c = 0
            var det = request_data.date + "/" + request_data.month + "/" + request_data.year
            for (const key of result) {
                // console.log(key.result[0]['DateTime'])
                var s = key.result[0]['DateTime'].split(" ")
                // console.log(s[0] + "----" + det)
                if (s[0] === det && key.result[0]['Power_1'] != '---' ) {
                    console.log(key.create.toLocaleDateString())
                    // console.log(request_data.localdate)
                    data.push(key)
                    c += 1
                } else {
                    //end
                }
            }
            console.log(c)
            res.status(200).send(data)
        }).catch(err => {
            res.status(400).send({
                err: err
            })
            console.log("error")
        })
    }
    
    // res.status(200).send({
    //     msg: request_data
    // })
})

app.post('/meter', function (req, res) {
    var request_data = req.body

    mongoose.connection.db.listCollections().toArray(function (err, names) {
        var coun = 0;
        for (const i of names) {
            if (i.name.slice(0, i.name.length - 1) == request_data.building.toLowerCase()) {
                coun += 1;
            }
        }
        res.status(200).send({
            count: coun
        })
    })
})

app.post('/test', function (req, res) {
    const File = mongoose.model(req.body.building + req.body.block, FileSchema);
    File.findOne({}, {}, { sort: { 'create': -1 } }, function (err, result) {
        var resq = result.create
        var ress = new Date(req.body.date)
        // res.send(resq.getHours())
        // if (ress.getDate() == resq.getDate() && ress.getFullYear() == resq.getFullYear() && ress.getMonth() == resq.getMonth()) {
        //     res.send(result)
        // } else {    
        //     res.send(result)
        // }
        res.status(200).send({
            name: resq.getHours() + ":" + resq.getMinutes()
        })
    }).catch(err => {
        res.status(400).send({
            msg: "no data or type not support"

        })
    })
})

app.get('/data', function (req, res) {
    if (req.body.building) {
        const File = mongoose.model(req.body.building + req.body.block, FileSchema);
        File.find({}, {}, { sort: { 'create': -1 } }, function (err, result) {
            res.status(200).send(result)
            console.log('show data')
        }).limit(5).catch(err => {
            res.status(400).send({
                msg: "no data or type not support"
            })
        })
    } else {
        res.status(200).send("Format Data not true")
    }
})

// app.post('/data', (req, res) => {

//     var request_data = req.body;
//     var count = Object.keys(req.body).length;
//     var date = new Date()
//     var resw = {
//         building: request_data.building.toUpperCase(),
//         result: [JSON.parse(request_data.result)],
//         block: request_data.block,
//         create: date
//     }

//     const File = mongoose.model(request_data.building + request_data.block, FileSchema);
//     // console.log(File)
//     if (count != 0) {
//         if (request_data) {
//             File.find({}, {}, { sort: { 'create': -1 } }, function (err, data) {
//                 if (data.length < 1) {
//                     console.log("ข้อมูลแรก")
//                     new File({
//                         building: request_data.building.toUpperCase(),
//                         result: JSON.parse(request_data.result),
//                         block: request_data.block,
//                         create: date
//                     }).save().then(() => {
//                         File.findOne({}, {}, { sort: { 'create': -1 } }, function (err, result) {
//                             var nameupper = request_data.building.toLowerCase()
//                             if (result.length < 1 || err) {
//                                 io.sockets.emit(nameupper + request_data.block, { success: true, msg: 'no data' });
//                                 res.send({ success: false })
//                             } else {
//                                 io.sockets.emit(nameupper + request_data.block, { success: true, data: result })
//                                 res.send({ success: true })
//                             }
//                         })
//                     }).catch(err => {
//                         res.status(200).send({
//                             msg: err
//                         })
//                     })
//                 } else if (data[0].create.getMinutes() + 1 <= date.getMinutes() || data[0].create.getHours() != date.getHours() || data[0].create.getMinutes() - 1 >= date.getMinutes()) {
//                     console.log("บันทึกข้อมูล")
//                     // console.log(data[0].create.getMinutes() + 4)
//                     // console.log(date.getMinutes())
//                     // console.log(date)
//                     new File({
//                         building: request_data.building.toUpperCase(),
//                         result: JSON.parse(request_data.result),
//                         block: request_data.block,
//                         create: date
//                     }).save().then(() => {
//                         File.findOne({}, {}, { sort: { 'create': -1 } }, function (err, result) {
//                             var nameupper = request_data.building.toLowerCase()
//                             if (result.length < 1 || err) {
//                                 io.sockets.emit(nameupper + request_data.block, { success: true, msg: 'no data' });
//                                 res.send({ success: false })
//                             } else {
//                                 io.sockets.emit(nameupper + request_data.block, { success: true, data: result })
//                                 res.send({ success: true })
//                             }
//                         })
//                     }).catch(err => {
//                         res.status(200).send({
//                             msg: err
//                         })
//                     })
//                 } else {
//                     console.log("ไม่บันทึกข้อมูล")
//                     // console.log(date.getMinutes())
//                     // console.log(data[0].create.getMinutes() + 4)
//                     var nameupper = request_data.building.toLowerCase()
//                     if (JSON.parse(request_data.result).length < 1 || err) {
//                         io.sockets.emit(nameupper + request_data.block, { success: true, msg: 'no data' });
//                         res.send({ success: false })
//                     } else {
//                         io.sockets.emit(nameupper + request_data.block, { success: true, data: resw })
//                         res.send({ success: true })
//                     }
//                 }
//             }).catch(err => {
//                 console.log(err)
//             })
//         } else {
//             res.status(200).send({
//                 success: false,
//                 msg: 'bad_request',
//                 detail: 'result not found'
//             })
//         }
//     } else {
//         res.status(200).send({
//             success: false,
//             msg: 'bad_request',
//             detail: 'type or data not true'
//         })
//     }
// })

app.get('/alldata', (req,res) => {
        const File = mongoose.model(req.body.building + req.body.block, FileSchema);
        File.find({}, {}, { sort: { 'create': -1 } }, function (err, result) {
            res.status(200).send(result)
            console.log('show data')
        }).catch(err => {
            res.status(400).send({
                msg: "no data or type not support"
            })
        })
        // var datass = []
        // mongoose.connection.db.listCollections().toArray(function (err, names) {
        //     sum = 0;
        //     for (const i of names) {
        //         const datas = mongoose.model(i.name, FileSchema)
        //         datas.find({}, {}, { sort: { 'create': -1 } }, function (err, result) {
        //             if (result.length < 1 || err) {
        //                 datass.push(result);
        //             } else {
        //                 // console.log(result)
        //                 sum += 1;
        //                 datass.push(result);
        //             }
        //             if (sum == 7) {
        //                 res.send({success: true,data: datass})
        //             }
        //         }).catch(err => {
        //             console.log("error")
        //         })
        //     }
        // })
})

app.post('/dateTOdate',(req,res) => {
    var request_data = req.body
    if (request_data.length < -1) {
        res.send({
            msg: request_data
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block , FileSchema)
        console.log(request_data.building.toLowerCase() + request_data.block)
        datas.find({}, {}, {sort: { 'create': 1 }}, function (err, result) {
            var data = []
            // console.log()
            var c = 0
            var det = request_data.date + "/" + request_data.month + "/" + request_data.year
            var det2 = request_data.date2 + "/" + request_data.month2 + "/" + request_data.year2
            // console.log(det2)
            if (request_data.present === "true") {
                for (const key of result) {
                    // console.log(key.result[0]['DateTime'])
                    var s = key.result[0]['DateTime'].split(" ")
                    // console.log(s[0] + "----" + det)
                    if (s[0] === det && key.result[0]['Power_1'] != '---' ) {
                        console.log(key.create.toLocaleDateString())
                        // console.log(request_data.localdate)
                        data.push(key)
                        c += 1
                    }
                }
            }else if(det === det2){
                //end
            } 
            else {
                    console.log("else")
                    det = det.split("/")
                    det2 = det2.split("/")
                    for (const key of result) {
                        var s = key.result[0]['DateTime'].split(" ")
                        var de = s[0].split("/");
                        // console.log(parseInt(de[2]) + " === " + parseInt(det[2]))
                        if (parseInt(de[2]) === parseInt(det2[2]) && parseInt(de[2]) > parseInt(det[2])) {
                            console.log("year === year2")
                            if (parseInt(de[1]) === parseInt(det2[1])) {
                                if (parseInt(de[0]) <= parseInt(det2[0])) {
                                    data.push(key)
                                }
                            }else if(parseInt(de[1]) < parseInt(det2[1])){
                                data.push(key)
                            }
                            // data.push(key)
                        }else if(parseInt(de[2]) < parseInt(det2[2]) && parseInt(de[2]) > parseInt(det[2])){
                            data.push(key)
                        }else if(parseInt(de[2]) === parseInt(det[2])){
                            console.log("year === year1")
                            // console.log("k")
                            if (parseInt(det[2]) != parseInt(det2[2])) {
                                if (parseInt(de[1]) === parseInt(det[1])) {
                                    console.log("k2")
                                    if (parseInt(de[0]) >= parseInt(det[0])) {
                                        data.push(key)
                                    }
                                }else if(parseInt(de[1]) > parseInt(det[1])){
                                    data.push(key)
                                }
                            } else if(parseInt(det[2]) === parseInt(det2[2])){
                                if (parseInt(det[1]) === parseInt(det2[1])) {
                                    if (parseInt(de[0]) >= parseInt(det[0]) && parseInt(de[0]) <= parseInt(det2[0])) {
                                        data.push(key)
                                    }
                                }else if(parseInt(det[1]) != parseInt(det2[1])){
                                    if (parseInt(de[1]) === parseInt(det[1]) ) {
                                        if (parseInt(de[0]) >= parseInt(det[0])) {
                                            data.push(key)
                                        }
                                    }else if(parseInt(de[1]) > parseInt(det[1]) && parseInt(de[1]) < parseInt(det2[1]) ){
                                        data.push(key)
                                    }else if(parseInt(de[1]) === parseInt(det2[1])){
                                        if (parseInt(de[0]) <= parseInt(det2[0])) {
                                            data.push(key)
                                        }
                                    }
                                }
                            }
                            
                        }
                    }
                // for (const key of result) {
                //     var s = key.result[0]['DateTime'].split(" ")
                //     var de = s[0].split("/");

                //     if (det[2] < parseInt(det2[2]) && de[2] >= det[2]) {
                //         data.push(key)
                //     }else if(det[2] === det2[2] && de[2] === det[2]){
                //         if (det[1] < det2[1] && de[1] >= det[1]) {
                //             data.push(key)
                //         }else if(det[1] === det2[1] && de[1] === det[1]){
                //             if (det[0] <= det2[0] && de[0] >= det[0]) {
                //                 data.push(key)
                //             }
                //         }
                //     }
                // }
            }
            // console.log(c)
            res.status(200).send(data)
        }).catch(err => {
            res.status(400).send({
                err: err
            })
            console.log("error")
        })
    }
})

server.listen(port, function (req, res) {
    console.log("connect port 2000")
})