import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import dayjs from 'dayjs';
import joi from 'joi';
import { MongoClient } from 'mongodb';
dotenv.config();

const server = express();

server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("batepapouol");
});

const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('private_message', 'message').required(),
    time: joi.string().required()
});

server.post('/participantes', (req,res) => {
    const username = req.body;

    const validation = userSchema.validate(username);

    if (validation.error) {
        return res.status(422).send(validation.error.details[0].message);
    }

    db.collection("participantes").findOne({
        username
    }).then(user => {
        if (user === null) {
            db.collection("participantes").insertOne({
                ...username,
                lastStatus: Date.now()
            });
            db.collection("messages").insertOne({
                from: username.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'message',
                time: dayjs().format('HH:mm:ss')
            });
            res.status(201).send("ok");
            return;
        } else {
            return res.status(409).send();
        }
    });
})

server.get('/participantes', (req, res) => {
    db.collection("participantes").find().toArray().then(users => {
		res.send(users);
	});
});

server.post('/messages', (req, res) => {
    const { to, text, type } = req.body;
    const from = req.headers.user;

    const message = {
        from: from,
        to: to,
        text: text,
        type: type,
        time: dayjs().format('HH:mm:ss')
    }

    const validation = messageSchema.validate(message, {abortEarly: false});

    if (validation.error) {
        return res.status(422).send(validation.error.details.map(value => value.message));
    }
    
    db.collection("participantes").findOne({
        name: from
    }).then(user =>{
        if (user === null) {
            return res.status(422).send({error: 'Participante não existente'});
        } else {
            db.collection("messages").insertOne(message);
            return res.status(201).send("ok");
        }
    });
});

server.get('/messages', (req, res) => {
    const user = req.headers.user;
    const { limit } = req.query;

    db.collection("messages").find().toArray().then(messages => {
        const usermessage = messages.filter(value => value.to === user || value.to === 'Todos' || value.from === user);
		if(!limit) {
            res.send(usermessage);
            return;
        }
        const select = usermessage.slice(limit * -1)
        res.send(select);
	});
});

server.post('/status', (req, res) => {

});

server.listen(5000, () => console.log('Listen on port 5000'));