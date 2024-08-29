import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
import moment from 'moment-timezone';
import { createLeadService, createResponse, formatNumber, formatChatId, getLeads } from './src/services/leadServices.js';
import ejs from 'ejs';
import { getLeadByChatId, updateLeadByChatId, updateLeadById } from './src/dao/leadDAO.js';
import config from './src/config/config.js';
import fs from 'fs';
import MongoStore from './src/dao/sessionDAO.js';

const { Client, LocalAuth, RemoteAuth } = pkg;

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const sessionsDir = path.join(__dirname, 'whatsapp-sessions');
// if (!fs.existsSync(sessionsDir)) {
//     fs.mkdirSync(sessionsDir, { recursive: true });
// }

let qrData;

app.get('/qr', async (req, res) => {
    const data = qrData;

    try {
        const qrText = data;
        res.render('qr-code', { qrText });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating QR code');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


let client = new Client({
    authStrategy: new RemoteAuth({
        store: new MongoStore(`client-0206`),
        backupSyncIntervalMs: 60000
    }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    },
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014587000-alpha.html",
    }
});

const initializeClient = () => {
    client.on('qr', async (qr) => {
        qrData = qr;
        console.log(`Este es la data de qr: ${qrData}`);

    });

    client.on('ready', async () => {
        console.log('Client is ready!');
    });

    client.on('disconnected', async (reason) => {
        console.log('Cliente desconectado:', reason);

    });

    client.on('message', async (msg) => {
        try {

        } catch (error) {

        }
        try {
            let chatId = msg.from;
            console.log(`Se recibio mensaje de ${chatId}`);

            let lead = getLeadByChatId(chatId);

            if (!lead) {
                let lead = await createLeadService(chatId);
            }

        } catch (error) {
            console.error("Error al procesar el mensaje:", error);
        }
    });

    client.initialize();
};

initializeClient();

const processLead = async chatId => {
    try {
        console.log(`Se recibio mensaje de ${chatId}`);
        if (lastMessageChatId === chatId) {
            console.log("Ya se envió un mensaje a este número anteriormente. Evitando enviar otro.");
            return;
        } else {
            let lead = await createLeadService(chatId);
            if (lead) {
                console.log(lead)
            }
        }
    } catch (error) {
        console.error("Error al procesar el mensaje:", error);
    }
};

app.get('/shutdown', async (req, res) => {
    try {
        await client.destroy();
        console.log('Client has been shut down');
        client = new Client({
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            },
            webVersionCache: {
                type: "remote",
                remotePath:
                    "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014587000-alpha.html",
            }
        });
        initializeClient();
        console.log('Client has been restarted');
        res.send('Client has been restarted');
    } catch (error) {
        console.error('Error shutting down client:', error);
        res.status(500).send('Error shutting down client');
    }
});

app.get('/leads', async (req, res) => {
    let filter = req.query ? req.query.filter : '';
    try {
        let leads = await getLeads(filter);
        res.render('leads-view', { leads });
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post('/leads', async (req, res) => {
    let chatId = req.body.chatId;
    try {
        let result = await processLead(chatId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/leads/all', async (req, res) => {
    try {
        let leads = await getLeads();

        let mappedLeads = leads.map(lead => ({
            chatId: lead.chatId,
            status: lead.status,
            clientPhone: lead.clientPhone,
            createdAt: moment.utc(lead.createdAt).tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD HH:mm:ss')
        }));

        res.send(mappedLeads);
    } catch (error) {
        res.status(500).send(error);
    }
})

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function getRandomMessage(msgs) {
    const indiceAleatorio = Math.floor(Math.random() * msgs.length);
    return msgs[indiceAleatorio];
}

const sendBulkMessages = async (phoneNumbersList, messages) => {
    try {
        for (const number of phoneNumbersList) {
            let msg = getRandomMessage(messages);
            // let fullMsg = `${msg}  👉🏻📲 5491125622482`;
            // let response = await client.sendMessage(number, fullMsg);
            console.log(`https://api.whatsapp.com/send/?phone=${number}&text=${msg}`)
            // await delay(10000);
        }
    } catch (error) {
        console.log('Error al enviar el mensaje:', error);
    }
};



app.get('/send', async (req, res) => {
    // let chatId = '5493764250975@c.us';
    // let message = 'Hola! como estas? Soy Carla tu cajera. Cualquier cosa que necesites me avisas.';
    try {
        let response = await sendBulkMessages(phoneList, mensajes);
        res.send(response);
    } catch (error) {
        console.log(error);
    }
})