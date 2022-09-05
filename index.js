import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import dayjs from 'dayjs';
import joi from 'joi';
import { MongoClient, ObjectId } from 'mongodb';
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

const EditSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('private_message', 'message').required()
});

server.post('/participants', async (req,res) => {
    const username = req.body;

    const validation = userSchema.validate(username);

    if (validation.error) {
        return res.status(422).send(validation.error.details[0].message);
    }

    try {
        const promisse = await db.collection("participantes").findOne(username);

        if (promisse === null) {
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
    } catch (error) {
        return res.status(500).send(error.message)
    }
})

server.get('/participants', (req, res) => {
    db.collection("participantes").find().toArray().then(users => {
		res.send(users);
	});
});

server.post('/messages', async (req, res) => {
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
    
    try {
        const promisse = await db.collection("participantes").findOne({name: from});
        
        if (promisse === null) {
            return res.status(422).send({error: 'Participante não existente'});
        } else {
            db.collection("messages").insertOne(message);
            return res.status(201).send("ok");
        }
    } catch (error) {
        return res.status(500).send(error.message)
    }
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

server.post('/status', async (req, res) => {
    const user = req.headers.user;

    try {
        const promisse = await db.collection("participantes").findOne({name: user});
        
        if (promisse === null) {
            return res.sendStatus(404)
        } else {
            await db.collection("participantes").updateOne({name: user}, {$set: {
                lastStatus: Date.now()
            }});
            return res.sendStatus(200);
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }   
});

setInterval(() => {
    db.collection("participantes").find().toArray().then(resp => {
        resp.forEach(element => {
            if (Date.now() - Number(element.lastStatus) > 15000) {
                db.collection("participantes").deleteOne(element);
                db.collection("messages").insertOne({
                    from: element.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'message',
                    time: dayjs().format('HH:mm:ss')
                });
            }
        });
    });
}, 15000);

/* Parte bônus*/

server.delete('/messages/:id', async (req,res) => {
    const usermessage = req.headers.user;
    const {id} = req.params;

    try {
        const promisse = await db.collection("messages").findOne({_id: new ObjectId(id)});
        if (!promisse) {
            return res.sendStatus(404);
        } else if (promisse.from !== usermessage) {
            return res.sendStatus(401);
        }

        await db.collection("messages").deleteOne({_id: new ObjectId(id)});

        res.sendStatus(200);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

server.put('/messages/:id', async (req, res) => {
    const { to, text, type } = req.body;
    const from = req.headers.user;
    const {id} = req.params;

    const message = {
        from: from,
        to: to,
        text: text,
        type: type
    }

    const validation = EditSchema.validate(message);

    if (validation.error) {
        return res.status(422).send(validation.error.details.map(value => value.message));
    }

    try {
        const promisse = await db.collection("messages").findOne({_id: new ObjectId(id)});
        if (!promisse) {
            return res.sendStatus(404);
        } else if (promisse.from !== from) {
            return res.sendStatus(401);
        }

        await db.collection("messages").updateOne({
            _id: new ObjectId(id)
        }, {$set: req.body});

        res.sendStatus(200);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

server.listen(5000, () => console.log('Listen on port 5000'));