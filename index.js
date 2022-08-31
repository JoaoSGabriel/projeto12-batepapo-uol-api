import express from 'express';
import cors from 'cors';

const server = express();

server.use(express.json());
server.use(cors());

server.post('/participantes', (req, res) => {
    const { Username } = req.body;

    if (!Username) {
        res.status(422).send({error: 'Todos os campos são obrigatórios!'});
        return
    }
    // if (Username está em uso) {
    //     res.status(409).send({error: 'Nome já está em uso'});
    //     return;
    // }

    res.status(201);
});

server.get('/participantes', (req, res) => {

});

server.post('/messages', (req, res) => {
    const { to, text, type } = req.body;
    const { from } = req.header.User;

    if (!to || !text) {
        res.status(422).send({error: 'Todos os campos são obrigatórios!'});
        return;
    } else if (type !== 'message' || type !== 'private_message') {
        res.status(422);
        return;
    } 
    // else if (participante não existente) {
    //     res.status(422);
    //     return;
    // }

    res.status(201);

});

server.get('/messages', (req, res) => {

});

server.post('/status', (req, res) => {

});

server.listen(5000, () => console.log('Listen on port 5000'));