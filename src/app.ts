require('dotenv').config();
import fs from 'fs';
import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import SpeechToTextV1  from 'ibm-watson/speech-to-text/v1';
import TextToSpeechV1 from 'ibm-watson/text-to-speech/v1';
import { IamAuthenticator } from 'ibm-watson/auth';
import chalk from 'chalk';

// API KEY SPEECH
const APIKEYSPEECH  = process.env.SPEECH_TO_TEXT_IAM_APIKEY;
const SPEECHURL = process.env.SPEECH_TO_TEXT_URL;

// API KEY TEXT
const APIKEYTEXT = process.env.TEXT_TO_SPEECH_IAM_APIKEY;
const TEXTURL = process.env.TEXT_TO_SPEECH_URL;

const PORT = process.env.PORT || '9999';
const app: Application = express();

const iamAuthenticatorSpeech = new IamAuthenticator({
    apikey: APIKEYSPEECH
});

const speechToText =  new SpeechToTextV1({
    authenticator: iamAuthenticatorSpeech,
    serviceUrl: `${SPEECHURL}`
});


const textToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({
        apikey: APIKEYTEXT
    }),
    serviceUrl: `${TEXTURL}`
});


const createBuffer = (base64: string, extension: string, nameFile: string = 'audio-transcrip'): Promise<any> => {
    return new Promise<any>((response, reject) => {
        if( base64 === null || base64 === undefined || base64.length < 1 ) {
            response({ exit: true});
            return;
        } else if ( extension === null || extension === undefined || extension.length < 1 ) { 
            response({ exit: true});
            return;
        } else {
            try {
                let index = base64.indexOf(',');
                let base64String = base64.slice(index + 1);
                let bufferData  = Buffer.from(base64String, 'base64');
                console.log(chalk.green('BUFFER CREADO'));
                response({created:true, buffer: bufferData});
            } catch (error) {
                reject(error);
            }
        }
    });
}


/**
 * 
 * @param path 
 * @param mimeType 
 * @returns 
 */

const proccesTranscript = (dataBuffer: Buffer, mimeType: string = 'audio/ogg'): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        speechToText.recognize({ 
            contentType: mimeType, 
            audio: dataBuffer,
            model : 'es-MX_NarrowbandModel'
            }).then((res) => {
            console.log(chalk.blueBright('TRANSCRIPCION OBTENIDA'));
            let response = res.result.results;
            let trasncript: string = '';
            response.forEach((speech) => {
                speech.alternatives.forEach((msg) => {
                    trasncript = `${trasncript} ${msg.transcript}`;
                });
            });
            resolve(trasncript);
        }).catch((err) => reject(err));
    });
} 


/**
 *  SERVER INIT
 */

export const SERVER = () => {
    middlewares();
    routes();
    listen();
}

const middlewares = () => {
    // middlewares
    app.use(express.json({ limit: '20mb' }));
    // LIMIT 20 MB
    app.use(cors());
}

const listen = () => {
    app.listen(PORT, () => {
        console.log(chalk.blue(`SERVER ON PORT ${PORT}`));
    });
} 

const routes = () => {
    
    app.post('/thomas-speech', (req: Request, res: Response) => {
        let { audioBase64 , mimeType } =  req.body;
        createBuffer(audioBase64, mimeType).then((resFile) => {
            if( resFile.exit  ) {
                res.send({
                    msg:'DATO ERRONEO'
                });
                return;
            }
            proccesTranscript(resFile.buffer, mimeType).then((trasncript)=> {
                res.send({
                    msg: trasncript
                });
            }).catch((err) => {
                res.send({
                    err
                });
            });
        }).catch((err) => {
            res.send({
                err
            });
        });
    });

    app.post('/thomas-text',  (req: Request, res: Response)=> {
        const { msg } = req.body;
        textToSpeech.synthesize({
            text: msg,
            voice: 'es-ES_EnriqueV3Voice',
            accept: 'audio/ogg'
        }).then(async (response)=> {
            let bufs = [];
            let result;
            response.result.on('data', (data) => {
                bufs.push(data);
            });
            response.result.on('end', () => {
              result = Buffer.concat(bufs);
              let base64 = result.toString('base64');
              res.send({
                  msg: 'data:audio/ogg;base64,'+base64
              });
            });
            
        })
    })    
}
