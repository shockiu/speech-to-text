require('dotenv').config();
import fs from 'fs';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1';
import { IamAuthenticator } from 'ibm-watson/auth';
import chalk from 'chalk';


const APIKEYSPEECH  = process.env.SPEECH_TO_TEXT_IAM_APIKEY;
const SPEECHURL = process.env.SPEECH_TO_TEXT_URL;
const PORT = process.env.PORT || '9999';
const app: Application = express();
const speechToText =  new SpeechToTextV1({
    authenticator: new IamAuthenticator({
        apikey: APIKEYSPEECH
    }),
    serviceUrl: `${SPEECHURL}`
});

export const writeFile = (base64: string): Promise<any> => {
    return new Promise<any>((response, reject) => {
        let base64String = base64;
        let namePath = 'audio-prueba.oga';
        base64String =  base64String.split(';base64,').pop();
        fs.writeFile('speech/'+namePath, base64String,  { encoding: 'base64' } , (err) => {
        if (err) {
            console.error(err);
            reject(false);
        }
          console.log('file saved to ');
          response({created:true, path: namePath});
        });
    });
}



export const SERVER = () => {
    middlewares();
    routes();
    listen();
}

const middlewares = () => {
    // middlewares
    app.use(express.json({ limit: '20mb' }));
    app.use(cors());
    /**
     * LIMITE DE 20MB por base 64
     */
}

const listen = () => {
    app.listen(PORT, () => {
        console.log(chalk.blue.bgYellow(`SERVER ON PORT ${PORT}`));
    });
} 

const routes = () => {
    app.post('/V1-thomas-speech', (req: Request, response_: Response) => {
        let audioBase64 =  req.body.audioBase64;
        writeFile(audioBase64).then((res) => {
            console.log(res);
            speechToText.recognize({ 
                contentType: 'audio/ogg', 
                audio: fs.createReadStream('speech/'+res.path),
                model : 'es-MX_NarrowbandModel'
                }).then((res) => {
                let response = res.result.results;
                let trasncript: string = '';
                response.forEach((speech) => {
                    console.log(speech.alternatives)
                    speech.alternatives.forEach((msg) => {
                        trasncript = `${trasncript} ${msg.transcript}`;
                    });
                });
                response_.send({
                    msg: trasncript
                });
            })
        });
    });
}




