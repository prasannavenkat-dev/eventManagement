const express = require('express');
const app = express();

//Dotenv
require('dotenv').config()

//Body parser 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

//Mongodbb
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;

//DB URL 
const dbUrl = process.env.DB_URL;
const port = process.env.PORT || 4000;


//BCRYPT
const bcrypt = require("bcrypt");

app.use(express.json());

app.get("/", async function (req, res) {

    try {
        //Connect db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');
        let collection = await db.collection("user").find().toArray();

        res.send(collection)

    } catch (error) {
        res.send(error)
    }
})

//REGISTER

app.post('/register', async function (req, res) {
    try {

        //Connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db("eventManagement");



        let { fullName, userName, password } = req.body;

        //Hashing Password
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(password, salt)
        let userData = {
            fullName, userName, password: hash
        }

 let userExisted = await db.collection("user").find({userName}).toArray();

 if(!userExisted.length){

    db.collection("user").insertOne(userData, function (err) {
        if (err) {
            console.log(err)
            console.log("Error updating db")
            throw err;
        }
        console.log("Inserted Succesfully")
        clientInfo.close();

    })

    res.send("Registerd Successfully!") 
 }
 else{
     res.send("User Already Existed!!Try Different User Name")
 }
 

    } catch (error) {
        console.log(error)

    }

})


//LOGIN 

app.post("/login", async function (req, res) {
    try {

        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');
        let { userName, password } = req.body;

        //Check If user existed

        let userData = await db.collection('user').find({ userName }).toArray();
        
        if (userData.length) {

            let passMatch = await bcrypt.compare(password, userData[0].password)

            if (passMatch) {
                res.send("Login Successfull")
            }
            else {
                res.send("Invalid Login")
            }
        }
        else {
            console.log("User Not existed");
            res.send("User Not existed")
        }
        clientInfo.close();

    } catch (error) {
        console.log(error)

    }
})


//UPDATE PASSWORD

app.post('/updatePassword', async function (req, res) {
    try {

        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');

        let { userName, currentPassword, newPassword } = req.body;
        let userData = await db.collection('user').find({ userName }).toArray();
        let passMatch = await bcrypt.compare(currentPassword, userData[0].password);

        if (passMatch) {

            //HASHING
            let salt = bcrypt.genSaltSync(10);
            let hash = await bcrypt.hashSync(newPassword, salt)

            try {

                await db.collection('user').updateOne({ userName }, {
                    $set: {
                        password: hash
                    }
                })

                res.send("Password Changed Successfully!!")

            } catch (error) {
                res.send("Error Updating Password")

            }
        }
        else {
            res.send("Invalid Password!!")
        }

        clientInfo.close();

    } catch (error) {
        console.log(error)
    }
})


//CREATE EVENT

app.post('/createEvent', async function (req, res) {
    try {

        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');

        let { eventName, eventCreator, date, invitees } = req.body

        //Insertion of Event Details

        db.collection('event').insertOne({ eventName, eventCreator, date, invitees }, function (err) {
            if (err) throw err;
            console.log("Created Event Successfully!!")
            clientInfo.close();

        })

        res.send("Event Created Successfully!!")

    } catch (error) {
        console.log(error)
    }
})

//USER CREATED EVENTS

app.get("/userCreatedEvents", async function (req, res) {
    try {

        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');
        let { userName } = req.body;

        //Get event List
        let eventsList = await db.collection("event").find({ eventCreator: userName }).toArray();
        res.send(eventsList)
        clientInfo.close();


    } catch (error) {
        console.log(error);
    }
})

//UPDATE EVENTS  

app.post('/updateEvent', async function (req, res) {
    try {

        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');

        let { eventName, date, newEventName, newDate } = req.body;

        try {
            //Update If event Exist
            let eventData = await db.collection("event").updateOne({ eventName, date }, {
                $set: {
                    eventName: newEventName,
                    date: newDate
                }
            })
            if (eventData.matchedCount) {
                res.send("Event Updated Succesfully!");
            }
            else {
                res.send("Event not exists!");
            }
        clientInfo.close();

        } catch (error) {
            res.send("Error updating Event!");
        }

    } catch (error) {
        console.log(error);
    }
})


//EVENTS INVITED BY OTHERS

app.get("/invitedEvents", async function (req, res) {
    try {
        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');
        let { userName } = req.body
        let eventsList = await db.collection("event").find({ invitees: { $in: [userName] } }).toArray();
        res.send(eventsList)
        clientInfo.close();

    } catch (error) {
        console.log(error)
    }
})

//GET EVENT

app.get("/getEvent", async function (req, res) {
    try {

        //connect to db
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('eventManagement');
        let { eventName, date } = req.body;
        //Get specific Event from DB
        let eventList = await db.collection("event").find({ $or: [ { eventName }, { date } ] }).toArray();

        res.send(eventList)
        clientInfo.close();
        
    } catch (error) {
        console.log(error);
        res.send(error)
    }
    
})

//APP LISTENER
app.listen(port, (err) => {
    if (err) {
        console.log("Error connecting server");
    } else {
        console.log(`Server running on ${port}`)
    }
})