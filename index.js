import express from 'express';
import cors from 'cors';

const server = express();

server.use(express.json());
server.use(cors());

server.post('/participantes', () => {

});

server.get('/participantes', () => {

});

server.post('/messages', () => {

});

server.get('/messages', () => {

});

server.post('/status', () => {

});

server.listen(5000, () => console.log('Listen on port 5000'));