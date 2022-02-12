const express = require('express');
const bodyPaser = require('body-parser');
const mongoose = require('mongoose');
const port = process.env.PORT || 80;
const FileSchema = require('./File')
const app = express();
const cors = require('cors');
const server = require('http').Server(app)
const io = require('socket.io')(server);
const path = require('path');
const { strict } = require('assert');
const fs = require('fs')

// MQTT
var mqtt = require('mqtt');
var MQTT_SERVER = "10.27.50.43"
var MQTT_PORT = "1883"
var MQTT_USER = "monitor"
var MQTT_PASSWORD = "1234"

var client = mqtt.connect({
    host: MQTT_SERVER,
    port: MQTT_PORT,
    username: MQTT_USER,
    password: MQTT_PASSWORD
});

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

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'Energy')));

mongoose.connect('mongodb://127.0.0.1:27017/ploy', option, () => {
    console.log('connect to mongodb')
})

// mongoose.connect('mongodb+srv://patinya:8273083743@cluster0.pvjq7.gcp.mongodb.net/energy-power',option, ()=>{
//     console.log('connect to mongodb')
// })

io.on('connection', function (socket) {

    console.log("user on")

    mongoose.connection.db.listCollections().toArray(function (err, names) {
        for (const i of names) {
            const datas = mongoose.model(i.name, FileSchema)

            datas.find({}, {}, { sort: { 'create': -1 } }, function (err, result) {
                var nameda = i.name
                // var lengthda = nameda.length
                var res = nameda.toLowerCase()
                if (result.length < 1 || err) {
                    socket.emit(res, { success: true, msg: 'no data' })
                } else {
                    // console.log(result)

                    socket.emit(res, { success: 'check', data: result })
                }
            }).limit(1).catch(err => {
                console.log("error")
            })
        }
    })
    socket.emit("test", { success: true })

    socket.emit("test_1", { success: true, on_off: "off"})
    socket.emit("test_2", { success: true, on_off: "off"})
    socket.emit("test_3", { success: true, on_off: "off"})
    socket.emit("test_4", { success: true, on_off: "off"})

    socket.emit("mqtt", function () {
        client.publish("monitor", "{test: true}")
    })

    socket.on('disconnect', function () {
        console.log('dis')
    })

})

// app.post('/graph',function (req,res){
//     var request_data = req.body

// })

app.get('/', function (req, res) {
    res.send("Heelo")
})

app.get('/monitoring', function (req, res) { res.sendfile(path.join(__dirname, 'Energy/index.html')) })

app.get('/controller', function (req, res) { res.sendfile(path.join(__dirname, 'build/index.html')) })

app.get('/building', function (req, res) {
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        var array = [];
        var num = 0;
        for (const i of names) {
            num = 0;
            var lenname = i.name.slice(0, 4)
            for (const iterator of array) {
                if (lenname.toUpperCase() == iterator.toUpperCase()) {
                    console.log(lenname + "====" + iterator)
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

app.post('/history', function (req, res) {
    var request_data = req.body
    if (request_data.length < -1) {
        res.send({
            msg: request_data
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema)
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
                if (s[0] === det && key.result[0]['Power_1'] != '---') {
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

app.post('/data', (req, res) => {

    var request_data = req.body;
    var count = Object.keys(req.body).length;
    var date = new Date()
    console.log(request_data)
    var resw = [{
        building: request_data.building.toUpperCase(),
        result: [JSON.parse(request_data.result)],
        block: request_data.block,
        create: date
    }]
    const File = mongoose.model(request_data.building + request_data.block, FileSchema);
    console.log(File)
    if (count != 0) {
        if (request_data) {
            File.find({}, {}, { sort: { 'create': -1 } }, function (err, data) {
                if (data.length < 1) {
                    console.log("ข้อมูลแรก")
                    new File({
                        building: request_data.building.toUpperCase(),
                        result: JSON.parse(request_data.result),
                        block: request_data.block,
                        create: date
                    }).save().then(() => {
                        var nameupper = request_data.building.toLowerCase()
                        if (JSON.parse(request_data.result).length < 1 || err) {
                            io.sockets.emit(nameupper + request_data.block, { success: true, msg: 'no data' });
                            // console.log("show_data_realtime")
                            res.send({ success: false })
                        } else {
                            io.sockets.emit(nameupper + request_data.block, { success: true, data: resw })
                            console.log("show_data_realtime")
                            res.send({ success: true })
                        }
                    }).catch(err => {
                        res.status(200).send({
                            msg: err
                        })
                    })
                } else if (data[0].create.getMinutes() + 1 <= date.getMinutes() || data[0].create.getHours() != date.getHours() || data[0].create.getMinutes() - 1 >= date.getMinutes()) {
                    console.log("Save_data")
                    // console.log(data[0].create.getMinutes() + 4)
                    // console.log(date.getMinutes())
                    // console.log(date)
                    console.log(request_data.block)
                    new File({
                        building: request_data.building.toUpperCase(),
                        result: JSON.parse(request_data.result),
                        block: request_data.block,
                        create: date
                    }).save().then(() => {
                        var nameupper = request_data.building.toLowerCase()
                        if (JSON.parse(request_data.result).length < 1 || err) {
                            io.sockets.emit(nameupper + request_data.block, { success: true, msg: 'no data' });
                            // console.log("show_data_realtime")
                            res.send({ success: false })
                        } else {
                            io.sockets.emit(nameupper + request_data.block, { success: true, data: resw })
                            console.log("show_data_realtime")
                            res.send({ success: true })
                        }
                    }).catch(err => {
                        res.status(200).send({
                            msg: err
                        })
                    })
                } else {
                    console.log("No_save_data")
                    console.log(request_data.block)
                    // console.log(date.getMinutes())
                    // console.log(data[0].create.getMinutes() + 4)
                    var nameupper = request_data.block
                    if (JSON.parse(request_data.result).length < 1 || err) {
                        io.sockets.emit(nameupper + request_data.block, { success: true, msg: 'no data' });
                        // console.log("show_data_realtime")
                        res.send({ success: false })
                    } else {
                        io.sockets.emit(nameupper + request_data.block, { success: true, data: resw })
                        console.log("show_data_realtime")
                        res.send({ success: true })
                    }
                }
            }).limit(1).catch(err => {
                console.log("error na ja")
                console.log(err)
            })
        } else {
            console.log("count == 0")
            res.status(200).send({
                success: false,
                msg: 'bad_request',
                detail: 'result not found'
            })
        }
    } else {
        res.status(200).send({
            success: false,
            msg: 'bad_request',
            detail: 'type or data not true'
        })
    }
})

app.get('/alldata', (req, res) => {
    const File = mongoose.model(req.body.building + req.body.block, FileSchema);
    File.find({}, {}, { sort: { 'create': 1 } }, function (err, result) {
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

app.post('/testdate', (req, res) => {
    var request_data = req.body
    if (request_data < -1) {
        res.send({
            msg: request_data
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema);
        var date_1 = request_data.year + "-" + request_data.month + "-" + request_data.date + "T" + request_data.hour + ":00:00.000+07:00"
        var date_2 = request_data.year2 + "-" + request_data.month2 + "-" + request_data.date2 + "T" + request_data.hour2 + ":59:59.000+07:00"
        console.log(new Date(date_1))
        datas.find({ "create": { $gte: new Date(date_1), $lte: new Date(date_2) } }, {}, {}, function (err, result) {
            var data = []
            data.push(result)
            res.send(data)
        }).catch(err => {
            res.send({
                success: false,
                msg: err
            })
        })
    }
})

app.post('/dateTOdate2', (req, res) => {
    var request_data = req.body
    if (request_data < -1) {
        res.send({
            msg: "no request"
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema)
        var date_1 = request_data.year + "-" + request_data.month + "-" + request_data.date + "T" + request_data.hour + ":00:00.000+07:00"
        var date_2 = request_data.year2 + "-" + request_data.month2 + "-" + request_data.date2 + "T" + request_data.hour2 + ":59:59.000+07:00"
        var skip_res = 0

        // count data to skip data
        datas.count({ "create": { $gte: new Date(date_1), $lte: new Date(date_2) } }, function (err, result) {
            console.log(result)
            skip_res = result
            // find doc in dbs limit 50 doc
            datas.find({ "create": { $gte: new Date(date_1), $lte: new Date(date_2) } }, {}, {}, function (err, result) {
                var data = []
                data.push(result)
                res.status(200).send({
                    size: skip_res,
                    data: data[0]
                })
            }).limit(50).skip(50 * request_data.page).catch(err => {
                res.send({
                    msg: err
                })
            })
        }).catch(err => {
            res.send({
                msg: err
            })
        })
    }
})

app.post('/dateTOdate', (req, res) => {
    var request_data = req.body
    if (request_data < -1) {
        res.send({
            msg: "no request"
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema)
        var date_1 = request_data.year + "-" + request_data.month + "-" + request_data.date + "T" + request_data.hour + ":00:00.000+07:00"
        var date_2 = request_data.year2 + "-" + request_data.month2 + "-" + request_data.date2 + "T" + request_data.hour2 + ":59:59.000+07:00"

        datas.find({ "create": { $gte: new Date(date_1), $lte: new Date(date_2) } }, {}, {}, function (err, result) {
            var data = []
            data.push(result)
            res.status(200).send({
                data: data[0]
            })
        }).catch(err => {
            res.send({
                msg: err
            })
        })
    }
})

app.post('/dateTOdateGraph2', (req, res) => {
    var request_data = req.body
    if (request_data.length < -1) {
        res.send({
            msg: "no request"
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema)
        var date_1 = request_data.year + "-" + request_data.month + "-" + request_data.date + "T" + request_data.hour + ":00:00.000+07:00"
        var date_2 = request_data.year2 + "-" + request_data.month2 + "-" + request_data.date2 + "T" + request_data.hour2 + ":59:59.000+07:00"

        datas.find({ 'create': { $gte: new Date(date_1), $lte: new Date(date_2) } }, {}, {}, function (err, result) {
            console.log(result)
            var restdata = result
            var data = []
            var jo = restdata.length / 24
            jo = Math.ceil(jo)
            if (restdata.length % 2 != 0) {
                jo -= 1;
            }
            if (restdata.length <= 24) {
                data = restdata;
            } else {
                console.log(restdata.length)
                for (let index = 0; index < 25; index++) {
                    if (index === 0 && restdata[index] != null) {
                        data.push(restdata[index])
                    } else if (index === 24 && restdata[index] != null) {
                        data.push(restdata[restdata.length - 1])
                    } else if (restdata[index] != null && index * jo < restdata.length) {
                        data.push(restdata[index * jo])
                    }
                }
            }

            res.status(200).send(data)
        })

    }
})

app.post('/dateTOdateGraph', (req, res) => {
    var request_data = req.body
    if (request_data.length < -1) {
        res.send({
            msg: request_data
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema)
        console.log(request_data.building.toLowerCase() + request_data.block)
        datas.find({}, {}, {}, function (err, result) {
            // new Date(key.result[0]['DateTime'])
            // result.0.DateTime
            var data = []
            var restdata = []
            // console.log()
            var c = 0
            var det = request_data.date + "/" + request_data.month + "/" + request_data.year
            var det2 = request_data.date2 + "/" + request_data.month2 + "/" + request_data.year2

            var checkeuqal = request_data.date + "/" + request_data.month + "/" + request_data.year
            var checkeuqal2 = request_data.date2 + "/" + request_data.month2 + "/" + request_data.year2

            det = det.split("/")
            det2 = det2.split("/")

            // create date because check date of request === date of mongodb :)
            var date_request_1 = new Date(det[2], det[1], det[0]);
            var date_request_2 = new Date(det2[2], det2[1], det2[0]);

            var today = new Date()
            var now = new Date(today.getFullYear(), today.getMonth(), today.getDate())

            if (now >= date_request_1 && now <= date_request_2) {
                for (const key of result) {

                    // notice variable to keep date in database
                    let s = key.result[0]['DateTime'].split(" ")
                    let date_b = s[0].split("/")
                    let date_db = new Date(date_b[2], date_b[1], date_b[0])

                    // if date_db euqal now then put data in dabase in data to be send
                    if (date_db === now && key.result[0]['Power_1'] != '---') restdata.push(key);

                }
            }
            else if (checkeuqal === checkeuqal2) {
                // var reste = []
                // console.log("date == date")
                for (const key of result) {
                    let s = key.result[0]['DateTime'].split(" ")
                    let date_b = s[0].split("/")
                    let date_db = new Date(date_b[2], date_b[1], date_b[0])
                    var time = s[1].split(":")
                    console.log(s[0] + "----" + det)
                    if (date_db >= date_request_1 && date_db <= date_request_2) {
                        console.log(time[0] + 1)
                        console.log(request_data.hour + 1)
                        if (time[0] >= request_data.hour && time[0] <= request_data.hour2 && key.result[0]['Power_1'] != '---') {
                            before = parseInt(time[0])
                            restdata.push(key)
                        }
                    }
                }
            }
            else {
                console.log("else")
                console.log(date_request_1 + " ---- " + date_request_2)
                // loop data in database for put in variable array type
                for (const keys of result) {

                    // notice variable to keep date in database
                    let s = keys.result[0]['DateTime'].split(" ")
                    let date_b = s[0].split("/")
                    let date_db = new Date(date_b[2], date_b[1], date_b[0])

                    // check if data_db in the range of data_request_1 and data_request_2.
                    // if data_db is in the range of the data_request_1 and request_2
                    if (date_db >= date_request_1 && date_db <= date_request_2 && keys.result[0]['Power_1'] != '---') {

                        // put data in data to be send
                        restdata.push(keys)
                    }
                }

            }

            var jo = restdata.length / 22
            jo = Math.ceil(jo)
            console.log(jo)
            // console.log(restdata.length)
            // console.log(restdata[1])
            // console.log(request_data[1 * jo])
            if (restdata.length % 2 != 0) {
                jo -= 1;
            }
            if (restdata.length <= 24) {
                data = restdata;
            } else {
                console.log(restdata.length)
                for (let index = 0; index < 24; index++) {
                    if (index === 0 && restdata[index] != null) {
                        data.push(restdata[index])
                    } else if (index === 23 && restdata[index] != null) {
                        data.push(restdata[restdata.length - 1])
                    } else if (restdata[index] != null && index * jo < restdata.length) {
                        console.log(index * jo)
                        data.push(restdata[index * jo])
                        // console.log(restdata[index * jo])
                    }
                }
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

app.post('/energy', (req, res) => {
    request_data = req.body
    if (request_data.length < -1) {
        res.send({
            msg: request_data
        })
    } else {
        const datas = mongoose.model(request_data.building.toLowerCase() + request_data.block, FileSchema)
        // console.log(request_data.building.toLowerCase() + request_data.block)
        datas.find({}, {}, {}, function (err, result) {
            var data = []
            var month = {
                "0": 0,
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0,
                "6": 0,
                "7": 0,
                "8": 0,
                "9": 0,
                "10": 0,
                "11": 0,
                "12": 0
            }
            var month1 = {
                "0": 0,
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0,
                "6": 0,
                "7": 0,
                "8": 0,
                "9": 0,
                "10": 0,
                "11": 0,
                "12": 0
            }
            var c = 0
            var det = request_data.date + "/" + request_data.month + "/" + request_data.year
            det = det.split("/")
            var before_det = parseInt(det[2]) - 1
            var dett = new Date(det[2])
            var today = new Date()
            var now = new Date(today.getFullYear())
            // var month = request_data.month
            var month_if_yearnotpresent = 12

            for (const key of result) {
                // console.log(key.result[0]['DateTime'])
                var s = key.result[0]['DateTime'].split(" ")
                var year = s[0].split("/")
                var before_year = parseInt(year[2]) - 1
                // console.log(year)
                var date_data = year[1]
                // console.log(s[0] + "----" + det)
                // if (now != dett) {
                //     if (det[2] == date_data[2]) {

                //     }
                // }
                if (det[2] == year[2]) {
                    // console.log("show me")
                    // console.log(date_data)
                    month[date_data] = parseInt(key.result[0]['Energy_Ex'])
                }
                // console.log(before_year.toString() + "==" + det[2])
                if (before_det == year[2] && year[1] == "12") {
                    month["0"] = parseInt(key.result[0]['Energy_Ex'])
                }
            }
            console.log(month)
            for (const ke in month) {
                if (ke == "0") {
                    continue
                }
                else {
                    ket = parseInt(ke) - 1
                    console.log(ke + "------" + ket)
                    // console.log("------")
                    if (month[ke] - month[ket.toString()] < 0) {
                        continue
                    } else {
                        month1[ke] = month[ke] - month[ket.toString()]
                    }
                }
            }
            data.push(month1)
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

app.post('/backup', function (req, res) {

})

app.post('/mqtt_pub', function (req, res) {

    const request_body = req.body
    var truth_on, truth_off, name_monitor
    console.log(request_body)
    if (request_body.OnOff == true) {
        name_monitor = "sw" + request_body.monitor.padStart(2, 0) + "_on"
    } else if (request_body.OnOff == false) {
        name_monitor = "sw" + request_body.monitor.padStart(2, 0) + "_off"
    }

    client.publish("usiscontrol", name_monitor)

    res.send({ test: "ok" })
})

app.get("/mqtt_sub", function (req, res) {
    client.on('connect', function () {
        // Subscribe any topic
        console.log("MQTT Connect");
        client.subscribe('test', function (err) {
            if (err) {
                console.log(err);
            }
        });
    });

    // Receive Message and print on terminal
    client.on('message', function (topic, message) {
        // message is Buffer
        console.log(message.toString());
    });
})

app.post("/test_netpie", function (req,res){
    const request_body = req.body
    console.log(request_body)
    // var ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress
    // console.log(req.socket.remoteAddress)
    io.sockets.emit("test_ip",{ip: req.ip})
    io.sockets.emit("test_netpie_body",{body: JSON.stringify(req.body),body_not_json: req.body})
    if (request_body.device == "1") {
        console.log("device_1")
        io.sockets.emit("test_1", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "2"){
        console.log("device_2")
        io.sockets.emit("test_2", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "3"){
        console.log("device_3")
        io.sockets.emit("test_3", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "4"){
        console.log("device_4")
        io.sockets.emit("test_4", { success: true, on_off: request_body.deviceChange })
    }
    res.send("ok")
})

app.get("/test_netpie", function (req,res){
    const request_body = req.body
    console.log(request_body)
    // var ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress
    // console.log(req.socket.remoteAddress)
    io.sockets.emit("test_ip",{ip: req.ip})
    io.sockets.emit("test_netpie_body",{body: JSON.stringify(req.body),body_not_json: req.body})
    if (request_body.device == "1") {
        console.log("device_1")
        io.sockets.emit("test_1", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "2"){
        console.log("device_2")
        io.sockets.emit("test_2", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "3"){
        console.log("device_3")
        io.sockets.emit("test_3", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "4"){
        console.log("device_4")
        io.sockets.emit("test_4", { success: true, on_off: request_body.deviceChange })
    }
    res.send("ok")
})

app.put("/test_netpie", function (req,res){
    const request_body = req.body
    console.log(request_body)
    // var ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress
    // console.log(req.socket.remoteAddress)
    io.sockets.emit("test_ip",{ip: req.ip})
    io.sockets.emit("test_netpie_body",{body: JSON.stringify(req.body),body_not_json: req.body})
    if (request_body.device == "1") {
        console.log("device_1")
        io.sockets.emit("test_1", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "2"){
        console.log("device_2")
        io.sockets.emit("test_2", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "3"){
        console.log("device_3")
        io.sockets.emit("test_3", { success: true, on_off: request_body.deviceChange })
    }else if(request_body.device == "4"){
        console.log("device_4")
        io.sockets.emit("test_4", { success: true, on_off: request_body.deviceChange })
    }
    res.send("ok")
})

app.get("/show_test_netpie", function (req,res){
    console.log(req.ip)
    io.sockets.emit("test_ip",{ip: req.ip})
    res.sendFile(__dirname + '/index.html');
})

app.get("/show_body_netpie", function (req,res){
    res.sendFile(__dirname + '/test_body.html')
})

// app.post("test_netpie_body", function(req,res){
//     io.sockets.emit("test_netpie_body",{body: req.body,all_request: req})
//     res.send({
//         body: req.body,
//         all_request: req
//     })
// })

server.listen(port, function (req, res) {
    console.log("connect port 80")
})