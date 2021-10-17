require('dotenv').config();
import fs from 'fs';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import SpeechToTextV1  from 'ibm-watson/speech-to-text/v1';
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

/**
 * 
 * @param base64 
 * @param extension 
 * @param nameFile 
 * @returns 
 */

const listMimeTypeAndExtension = [
    { mimeType: 'audio/ogg', extencion: '.oga' },
    { mimeType: 'audio/webm', extencion: '.weba' },
    { mimeType: 'audio/basic', extencion: '.au' },
    { mimeType: 'audio/mpeg', extencion: '.mp3' },
    { mimeType: 'audio/flac', extencion: '.flac' },
    { mimeType: 'audio/wav', extencion: '.wav' }
];

const getFileExtension = (mimeType: string) => {
    return listMimeTypeAndExtension.find((file) => file.mimeType === mimeType);
}

const writeFile = (base64: string, extension: string, nameFile: string = 'audio-transcrip'): Promise<any> => {
    return new Promise<any>((response, reject) => {
        if( base64 === null || base64 === undefined || base64.length < 1 ) {
            response({ exit: true});
            return;
        } else if ( extension === null || extension === undefined || extension.length < 1 ) { 
            response({ exit: true});
            return;
        } else {
            let base64String = base64;
            let dotExtencion = getFileExtension(extension) === undefined ? false : getFileExtension(extension).extencion;

            if( dotExtencion === false ) {
                response({ exit: true });
                return;
            }

            let namePath = `${nameFile}${dotExtencion}`;
            base64String =  base64String.split(';base64,').pop();
            fs.writeFile('speech/'+namePath, base64String,  { encoding: 'base64' } , (err) => {
            if (err) {
                console.error(err);
                reject(false);
            }
            console.log(chalk.green('DOCUMENTO GUARDADO'));
            response({created:true, path: namePath});
            });
        }
    });
}


/**
 * 
 * @param path 
 * @param mimeType 
 * @returns 
 */

const proccesTranscript = (path: string, mimeType: string = 'audio/ogg'): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        speechToText.recognize({ 
            contentType: mimeType, 
            audio: fs.createReadStream('speech/'+path),
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
        writeFile(audioBase64, mimeType).then((resFile) => {
            if( resFile.exit  ) {
                res.send({
                    msg:'DATO ERRONEO'
                });
                return;
            }
            proccesTranscript(resFile.path, mimeType).then((trasncript)=> {
                res.send({
                    msg: trasncript
                });
                fs.unlink('speech/'+resFile.path, (err) => {
                    if(err) throw err;
                    console.log(chalk.red('ELIMINADO'));
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
}




