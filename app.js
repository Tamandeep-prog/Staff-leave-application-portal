const { query } = require("express");
const express = require("express");
const { Pool } = require("pg");

// mongo db thing/////////////////////////////
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/testdb', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected");
});

const dataSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    background: String,
    publication: [String],
    couses: [String]
}, {collection: 'data'}) ;

const dataModel = mongoose.model('dataModel', dataSchema);

const port = 3000;
const app = express();
app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    database: 'testdb',
	password: 't.d.s12042000',
    port: 5432, 
});

pool.on('error', (err, client) => {
    console.error('Error:', err);
});

app.get("/", function(req, res) {
    res.render("signup");
});

let demographics = {
    id:-1,
    nickname: "",
    number:-1,
    email:"",
    department: "",
};

let lq = [];

let ll = -1;

/////////////////////////////////////////// Phase 2 ///////////////////////////
let test = [1, 2, 3, 4, 5]

var mongodata = [];
app.get('/views/listofall.ejs', function(req, res){
    dataModel.find({}).then((result)=>{
        // console.log(result);
        mongodata = result;
        res.render("listofall", {list:mongodata} );
    })
});

app.post('/views/listofall.ejs', function(req, res){
    console.log(req.body);

    res.render("fromlistofall",{list: mongodata[req.body.index]});
});

///////////////////////////////////////////////////////////////////////////////

var whichPage = 1;
// director = 4 
// dportal = 3
// sportal = 2
// portal = 1

var demomongo = [];
app.post("/", function(req, res){
    console.log("id: "+ req.body['email'] +" password: "+ req.body['password']);

    dataModel.find({ _id: req.body['email'] }).then((result)=>{
        console.log(result);
        demomongo = result;
        if(result.length == 0) {
            console.log("empty");
        }

        pool.query('select * from password where id=$1', [req.body['email']]).then((result) => {
      
            if(result.rows[0]['password'] == req.body['password']) {
                console.log("yes");
    
                pool.query('select * from leaves where employ_id=$1', [req.body['email']]).then((result1)=>{
                    ll = result1.rows[0]['leaves_left'];
    
                    pool.query('select * from faculty where id=$1', [req.body['email']]).then((result) => {
    
                        if( result.rows == 0) {
                            
                            pool.query("select * from ccfaculty where id=$1", [req.body['email']]).then((result3)=>{
                                demographics['id'] = req.body['email']; 
                                demographics['nickname'] = result3.rows[0].name;
                                demographics['number'] = result3.rows[0].number;
                                demographics['email'] = result3.rows[0].email;
                                demographics['department'] = null;
                                pool.query("select * from Deans_Director where id=$1", [req.body['email']]).then((result4)=>{
                                    if(result4.rows[0].position=='Director')
                                    {
                                        whichPage = 4
                                        res.render("director", {list: demomongo[0],
                                        id: demographics['id'],
                                        nickname: demographics['nickname'],
                                        email: demographics['email'],
                                        number:demographics['number']});
                                    }
                                    else if(result4.rows[0].position=='Dean Faculty Affairs')
                                    {
                                        whichPage = 3
                                        res.render("dportal", {list: demomongo[0],
                                        id: demographics['id'],
                                        nickname: demographics['nickname'],
                                        email: demographics['email'],
                                        number:demographics['number']});
                                    }
                                });
                                
                            
    
                            }).catch((error3)=>{ console.log(error3); });
    
                        } else {
                            demographics['id'] = result.rows[0]['id']; demographics['email'] = result.rows[0]['email'];
                            demographics['nickname'] = result.rows[0]['name']; demographics['department'] = result.rows[0]['department'];
                            demographics['number'] = result.rows[0]['number'];
    
                                pool.query('select * from department where hod=$1',[req.body['email']]).then((result2)=>{
                                    console.log(result2.rows);
                                   
                                    if(result2.rowCount == 0) {
                                        whichPage = 1
                                        res.render("portal", {list: demomongo[0], email : result.rows[0]['email'],
                                        id: result.rows[0]['id'],
                                        nickname: result.rows[0]['name'],
                                        number: result.rows[0]['number'],
                                        department: result.rows[0]['department']
                                        });
                                    } else {
                                        console.log(demographics);
                                        
                                        whichPage = 2

                                        res.render("sportal", {list: demomongo[0],
                                        id: demographics['id'],
                                        nickname: demographics['nickname'],
                                        number: demographics['number'], 
                                        department:demographics['department'],
                                        email: demographics['email']
                                    });
                                    }
                                }).catch((error2)=>{ console.log(error2); });    
                        }
                    }).catch((error) => { console.log(error);  });
                }).catch((error1)=>{ console.log(error1);  }); 
            }
            else{ res.send("<h1>WRONG ID/PASSWORD</h1>");  }
        }).catch((error) => { console.log(error); });
    })
});
app.get('/leave', function(req, res) {

    pool.query('select * from past_application where a_id=$1',[demographics['id']]).then((result)=>{
        result.rows.forEach((x) =>{
            lq.push(x);
        });

        res.render("leave", {list: demomongo[0], ll: ll, row: result.rows, nickname: demographics['nickname']});
    }).catch((error) => {
        console.log(error);
    });
});
app.post('/leaveDetails', function(req, res){
    
    console.log(req.body);
    console.log(lq[req.body['index']]);
    
    res.render("leaveDetails", {
        a_id: lq[req.body['index']]['a_id'],
        status:lq[req.body['index']]['status'],
        post: lq[req.body['index']]['post'],
        reason:lq[req.body['index']]['reason'],
        comment: lq[req.body['index']]['comment'],
        submission_date:lq[req.body['index']]['date'],
        begin:lq[req.body['index']]['begin'],
        end:lq[req.body['index']]['upto'],
        nickname: demographics['nickname'],
    });
});
app.get('/personal', function(req, res) {
    res.render("portal",{list: demomongo[0], email : demographics['email'],
    id: demographics['id'],
    nickname: demographics['nickname'],
    number: demographics['number'],
    department: demographics['department']
   } );
});

app.get('/sportal', function(req, res) {

    res.render("sportal", {list: demomongo[0], id: demographics['id'],
    nickname: demographics['nickname'],
    number: demographics['number'], 
    department:demographics['department'],
    email: demographics['email']
});
});
app.get('/sleave', function(req, res){
    
    pool.query('select * from past_application where a_id=$1',[demographics['id']]).then((result)=>{
        result.rows.forEach((x) =>{
            lq.push(x);
        });

        res.render("sleave", {ll: ll, row: result.rows, nickname: demographics['nickname']});
    }).catch((error) => {
        console.log(error);
    });
});
app.post('/sleaveDetails', function(req, res){   
    console.log(req.body);
    console.log(lq[req.body['index']]);
    res.render("sleaveDetails", {
        a_id: lq[req.body['index']]['a_id'],
        status:lq[req.body['index']]['status'],
        post: lq[req.body['index']]['post'],
        reason:lq[req.body['index']]['reason'],
        comment: lq[req.body['index']]['comment'],
        submission_date:lq[req.body['index']]['date'],
        begin:lq[req.body['index']]['begin'],
        end:lq[req.body['index']]['upto'],
        nickname: demographics['nickname'],
    });
});
app.get('/snewleave', function(req, res){

    pool.query('select * from active_application where id=$1',[demographics['id']]).then((result)=> {
        console.log(result.rowCount);
        if(result.rowCount == 0) { 
            res.render("snewleave", {ll: ll, nickname: demographics['nickname']});     
        } else {
            console.log(result.rows);
            res.render("sactiveleave",{
                row:result.rows, nickname: demographics['nickname']
            });
        }
    }).catch((error)=>{
        console.log(error);
    });
});
app.post('/snewleave', function(req, res) {
    console.log(req.body);
    var drec= 'Director'
    pool.query('select * from deans_director where position = $1',[drec]).then((result1)=>{
        let hod = result1.rows[0].id;
        let  p = 'pending';

        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        console.log(date);

        pool.query("insert into active_application(status, id, e_id, reason, submission_date, begin, upto) values ($1, $2, $3, $4, $5, $6, $7)", [p,demographics['id'],hod,req.body.reason, date, req.body.begin, req.body.end]).then((result2)=>{
            console.log("worked");

            pool.query('select * from active_application where id=$1',[demographics['id']]).then((result)=> {
                console.log(result.rowCount);
                if(result.rowCount == 0) { 
                    res.render("snewleave", {ll: ll, nickname: demographics['nickname']});     
                } else {
                    console.log(result.rows);
                    res.render("sactiveleave",{
                        row:result.rows, nickname: demographics['nickname']
                    });
                }
            }).catch((error)=>{
                console.log(error);
            });
            
            // console.log(result2);
        }).catch((error2)=>{
            console.log("not worked");
        })
    });
});
app.get("/sstaffleave", function(req, res) {
    
    pool.query("select * from active_application where e_id=$1",[demographics['id']]).then((result1)=>{
        console.log(result1.rows);
    res.render("sstaffleave", {nickname: demographics['nickname'], row: result1.rows});
   }).catch((error1)=>{
        console.log(error1);
    });

});
app.post("/sstaffleave", function(req, res) {
    console.log(req.body);
    if(req.body.yesno==1){
        pool.query("update active_application set e_id=41 where id=$1",[req.body.id]).then((result1)=>{
            console.log(result1.rows);
         
            pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                console.log(result2.rows);
                res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
            }).catch((error2)=>{
                console.log(error2);
            });
       }).catch((error1)=>{
            console.log(error1);
        });

    }
    else
    {
        pool.query("update active_application set e_id=0 where id=$1",[req.body.id]).then((result1)=>{
            console.log(result1.rows);
         
            pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                console.log(result2.rows);
                res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
            }).catch((error2)=>{
                console.log(error2);
            });
       }).catch((error1)=>{
            console.log(error1);
        });

    }
});


app.get('/newleave', function(req, res){

    pool.query('select * from active_application where id=$1',[demographics['id']]).then((result)=> {
        console.log(result.rowCount);
        if(result.rowCount == 0) { 
            res.render("newleave", {ll: ll, nickname: demographics['nickname']});     
        } else {
            console.log(result.rows);
            res.render("activeleave",{
                row:result.rows, nickname: demographics['nickname']
            });
        }
    }).catch((error)=>{
        console.log(error);
    });
});

app.post('/newleave', function(req, res) {
    console.log(req);

    pool.query('select * from department where name=$1',[demographics['department']]).then((result1)=>{
        let hod = result1.rows[0].hod;
        let  p = 'pending';

        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        console.log(date);

        pool.query("insert into active_application(status, id, e_id, reason, submission_date, begin, upto) values ($1, $2, $3, $4, $5, $6, $7)", [p,demographics['id'],hod,req.body.reason, date, req.body.begin, req.body.end]).then((result2)=>{
            console.log("worked");

            pool.query('select * from active_application where id=$1',[demographics['id']]).then((result)=> {
                console.log(result.rowCount);
                if(result.rowCount == 0) { 
                    res.render("newleave", {ll: ll, nickname: demographics['nickname']});     
                } else {
                    console.log(result.rows);
                    res.render("activeleave",{
                        row:result.rows, nickname: demographics['nickname']
                    });
                }
            }).catch((error)=>{
                console.log(error);
            });
        }).catch((error2)=>{
            console.log("not worked");
        })

    });
});

// Director ka code

app.get("/director", function(req, res){

    res.render("director", {
        list: demomongo[0],
        id: demographics['id'],
        nickname: demographics['nickname'],
        email: demographics['email'],
        number:demographics['number']
        });

});

app.get("/assignhod", function(req, res) {
    pool.query("select * from department").then((result1)=>{
        // console.log(result1.rows);
        pool.query("select * from ccfaculty where id <> 42;").then((result2)=>{
            // console.log(result2.rows);
            res.render("assignhod", {dean: result2.rows , row:result1.rows ,nickname: demographics['nickname']});
        }).catch((error2)=>{
            console.log(error2);
        })
    }).catch((error1)=>{
        console.log(error1);
    });
});
app.post("/assignhod", function(req, res){
    console.log(req.body);
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    console.log(date);

    if (typeof req.body.dean !== 'undefined')
    {
        console.log("change dean");
        pool.query("update deans_director set id=$1, begin=$2 where position=$3",[req.body.new, date, req.body.dean]).then((result1)=> {
            console.log("worked");
            res.redirect("/assignhod");
        }).catch((error1)=> {
            console.log(error1);
        });   
    } else{
        console.log("change hod");
        pool.query("update department set hod=$1, begin=$2 where name=$3",[req.body.new, date, req.body.hod]).then((result1)=> {
            console.log("worked");
            res.redirect("/assignhod");
        }).catch((error1)=> {
            console.log(error1);
        });   
    }
});
app.get("/staffleave", function(req, res) {
    
    pool.query("select * from active_application where e_id=$1",[demographics['id']]).then((result1)=>{
    
        console.log(result1.rows);
    res.render("staffleave", {nickname: demographics['nickname'], row: result1.rows});
    }).catch((error1)=>{
        console.log(error1);
    });

});


app.post("/staffleave", function(req, res) {
    console.log(req.body);
    if(req.body.yesno==1){
        pool.query("update active_application set e_id=1 where id=$1",[req.body.id]).then((result1)=>{
            console.log(result1.rows);
         
            pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                console.log(result2.rows);
                res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
            }).catch((error2)=>{
                console.log(error2);
            });
       }).catch((error1)=>{
            console.log(error1);
        });

    }
    else
    {
        pool.query("update active_application set e_id=0 where id=$1",[req.body.id]).then((result1)=>{
            console.log(result1.rows);
         
            pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                console.log(result2.rows);
                res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
            }).catch((error2)=>{
                console.log(error2);
            });
       }).catch((error1)=>{
            console.log(error1);
        });
    }
});

app.get('/dportal', function(req, res) {

    res.render("dportal", {list: demomongo[0],
    id: demographics['id'],
    nickname: demographics['nickname'],
    number: demographics['number'], 
    email: demographics['email']
});
});
app.get('/dleave', function(req, res){
    
    pool.query('select * from past_application where a_id=$1',[demographics['id']]).then((result)=>{
        result.rows.forEach((x) =>{
            lq.push(x);
        });

        res.render("dleave", {ll: ll, row: result.rows, nickname: demographics['nickname']});
    }).catch((error) => {
        console.log(error);
    });
});
app.post('/dleaveDetails', function(req, res){   
    console.log(req.body);
    console.log(lq[req.body['index']]);
    res.render("dleaveDetails", {
        a_id: lq[req.body['index']]['a_id'],
        status:lq[req.body['index']]['status'],
        post: lq[req.body['index']]['post'],
        reason:lq[req.body['index']]['reason'],
        comment: lq[req.body['index']]['comment'],
        submission_date:lq[req.body['index']]['date'],
        begin:lq[req.body['index']]['begin'],
        end:lq[req.body['index']]['upto'],
        nickname: demographics['nickname'],
    });
});
app.get('/dnewleave', function(req, res){

    pool.query('select * from active_application where id=$1',[demographics['id']]).then((result)=> {
        console.log(result.rowCount);
        if(result.rowCount == 0) { 
            res.render("dnewleave", {ll: ll, nickname: demographics['nickname']});     
        } else {
            console.log(result.rows);
            res.render("dactiveleave",{
                row:result.rows, nickname: demographics['nickname']
            });
        }
    }).catch((error)=>{
        console.log(error);
    });
});
app.post('/dnewleave', function(req, res) {
    console.log(req.body);
    let position = 'Director';
    pool.query('select * from ccfaculty where position=$1',[position]).then((result1)=>{
        console.log(result1);
    });
});
app.get("/dstaffleave", function(req, res) {
    
    pool.query("select * from active_application where e_id=$1",[demographics['id']]).then((result1)=>{
        console.log(result1.rows);
    res.render("dstaffleave", {nickname: demographics['nickname'], row: result1.rows});
   }).catch((error1)=>{
        console.log(error1);
    });

});

app.post("/dstaffleave", function(req, res) {
    console.log(req.body);
    pool.query("select * from active_application where id=$1",[req.body.id]).then((result)=>{
        console.log(result);
        if(req.body.yesno==1 && result.rows[0].submission_date<=result.rows[0].begin){
            pool.query("update active_application set e_id=1 where id=$1",[req.body.id]).then((result1)=>{
                console.log(result1.rows);
             
                pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                    console.log(result2.rows);
                    res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
                }).catch((error2)=>{
                    console.log(error2);
                });
           }).catch((error1)=>{
                console.log(error1);
            });
    
        }
        else if(req.body.yesno==1){
            pool.query("update active_application set e_id=42 where id=$1",[req.body.id]).then((result1)=>{
                console.log(result1.rows);
             
                pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                    console.log(result2.rows);
                    res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
                }).catch((error2)=>{
                    console.log(error2);
                });
           }).catch((error1)=>{
                console.log(error1);
            });
    
        }
        else
        {
            pool.query("update active_application set e_id=0 where id=$1",[req.body.id]).then((result1)=>{
                console.log(result1.rows);
             
                pool.query("update past_application set comment=$1 where comment is NULL", [req.body.comment]).then((result2)=>{
                    console.log(result2.rows);
                    res.render("sstaffleave", {nickname: demographics['nickname'], row: result2.rows});
                }).catch((error2)=>{
                    console.log(error2);
                });
           }).catch((error1)=>{
                console.log(error1);
            });
        }
    }).catch((error)=>{
        console.log(error);
    });

});

//////////////////////////////////// phase 2 /////////////////////////////////////////

app.post('/publication', function(req, res) {
    console.log(demographics['id']);
    console.log(req.body);

    dataModel.find({ _id: demographics['id']}).then((result)=>{
        console.log(result);
        if(result.length == 0) {
            console.log("empty");
            // insert a person
            
            var arr = [{ 
                _id: demographics['id'],
                name: demographics['nickname'],
                background: "Faculty at IIT Ropar",
                publication:[ req.body['reason'] ],
                couses: []
             }];

             console.log(arr);

            dataModel.insertMany(arr,  function(error, docs) {
                console.log(error);
                console.log(docs);
                dataModel.find({ _id: demographics['id']}).then((result1)=>{
                    demomongo = result1;
                    switch(whichPage){
                        case 1:
                            res.redirect("/personal");
                            break;
                        case 2:
                            res.redirect("/sportal");
                            break;
                        case 3:
                            res.redirect("/dportal");
                            break;
                        case 4:
                            res.redirect("/director"); 
                            break;
                    }
                });
            })
        } else {
            console.log("not empty");
            // append to publications
            var element = result;
            element[0]['publication'].push(req.body.reason);
            console.log(element);
            dataModel.deleteOne({ _id: demographics['id']}).then((error, result)=>{
                console.log(error); console.log(result); 
                dataModel.insertMany(element,  function(error, docs) {
                    console.log(error);
                    console.log(docs);
                    dataModel.find({ _id: demographics['id']}).then((result1)=>{
                        demomongo = result1;
                        switch(whichPage){
                            case 1:
                                res.redirect("/personal");
                                break;
                            case 2:
                                res.redirect("/sportal");
                                break;
                            case 3:
                                res.redirect("/dportal");
                                break;
                            case 4:
                                res.redirect("/director"); 
                                break;
                        }
                    });
                });
            });
        }
    });
});


app.post('/couses', function(req, res) {
    console.log(demographics['id']);
    console.log(req.body);
    dataModel.find({ _id: demographics['id']}).then((result)=>{
        console.log(result);
        if(result.length == 0) {
            console.log("empty");
            // insert a person
           
            var arr = [{ 
                _id: demographics['id'],
                name: demographics['nickname'],
                background: "Faculty at IIT Ropar",
                publication:[],
                couses: [ req.body['reason'] ]
             }];

             console.log(arr);

            dataModel.insertMany(arr,  function(error, docs) {
                console.log(error);
                console.log(docs);
                
                dataModel.find({ _id: demographics['id']}).then((result1)=>{
                    demomongo = result1;
                    switch(whichPage){
                        case 1:
                            res.redirect("/personal");
                            break;
                        case 2:
                            res.redirect("/sportal");
                            break;
                        case 3:
                            res.redirect("/dportal");
                            break;
                        case 4:
                            res.redirect("/director"); 
                            break;
                    }
                });
                
            });

        } else {
            console.log("not empty");
            // append to publications
            var element = result;
            element[0]['couses'].push(req.body.reason);
            console.log(element);
            dataModel.deleteOne({ _id: demographics['id']}).then((error, result)=>{
                console.log(error); console.log(result); 
                dataModel.insertMany(element,  function(error, docs) {
                    console.log(error);
                    console.log(docs); 
                   
                    dataModel.find({ _id: demographics['id']}).then((result1)=>{
                        demomongo = result1;
                        switch(whichPage){
                            case 1:
                                res.redirect("/personal");
                                break;
                            case 2:
                                res.redirect("/sportal");
                                break;
                            case 3:
                                res.redirect("/dportal");
                                break;
                            case 4:
                                res.redirect("/director"); 
                                break;
                        }
                    });
                });
            });
        }
    });
});

app.post("/deletePub", function(req, res){
    console.log(req.body);

    dataModel.find({ _id: demographics['id']}).then((result)=>{
        console.log(result);
        result[0]['publication'].splice(req.body.index, 1);
        console.log(result);
       
        dataModel.deleteOne({ _id: demographics['id']}).then((error1, result1)=>{
            console.log(error1); console.log(result1); 

            dataModel.insertMany(result,  function(error, docs) {
                console.log(error);
                console.log(docs); 
               
                dataModel.find({ _id: demographics['id']}).then((result1)=>{
                    demomongo = result1;
                    switch(whichPage){
                        case 1:
                            res.redirect("/personal");
                            break;
                        case 2:
                            res.redirect("/sportal");
                            break;
                        case 3:
                            res.redirect("/dportal");
                            break;
                        case 4:
                            res.redirect("/director"); 
                            break;
                    }
                });
            });
        });

    });
});


app.post("/deleteCou", function(req, res){
    console.log(req.body);

    dataModel.find({ _id: demographics['id']}).then((result)=>{
        console.log(result);
        result[0]['couses'].splice(req.body.index, 1);
        console.log(result);
       
        dataModel.deleteOne({ _id: demographics['id']}).then((error1, result1)=>{
            console.log(error1); console.log(result1); 

            dataModel.insertMany(result,  function(error, docs) {
                console.log(error);
                console.log(docs); 
               
                dataModel.find({ _id: demographics['id']}).then((result1)=>{
                    demomongo = result1;
                    switch(whichPage){
                        case 1:
                            res.redirect("/personal");
                            break;
                        case 2:
                            res.redirect("/sportal");
                            break;
                        case 3:
                            res.redirect("/dportal");
                            break;
                        case 4:
                            res.redirect("/director"); 
                            break;
                    }
                });
            });
        });

    });
});

//////////////////////////////////////////////////////////////////////////////////////

app.listen(port, function(){
    console.log("Server started at port: ", port);
});