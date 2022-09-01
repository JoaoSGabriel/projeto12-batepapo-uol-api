import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import dayjs from 'dayjs';
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

server.post('/participantes', (req,res) => {
    const username = req.body.name;

    if (!username) {
        return res.status(422).send({error: 'Todos os campos são obrigatórios!'});
    }

    db.collection("participantes").findOne({
        name: username
    }).then(user => {
        if (user === null) {
            db.collection("participantes").insertOne({
                name: username,
                lastStatus: Date.now()
            });
            res.status(201).send("ok");
            return;
        } else {
            return res.status(409).send({error: 'Este usuário já existe!'});
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

    if (!to || !text) {
        res.status(422).send({error: 'Todos os campos são obrigatórios!'});
        return;
    }
    
    db.collection("participantes").findOne({
        name: from
    }).then(user =>{
        if (user === null) {
            return res.status(422).send({error: 'Participante não existente'});
        } else {
            db.collection("messages").insertOne({
                from: from,
                to: to,
                text: text,
                type: type,
                time: dayjs().format('HH:mm:ss')
            });
            res.status(201).send("ok");
            return;
        }
    });
});

server.get('/messages', (req, res) => {
    db.collection("messages").find().toArray().then(messages => {
		res.send(messages);
	});
});

server.post('/status', (req, res) => {

});

server.listen(5000, () => console.log('Listen on port 5000'));