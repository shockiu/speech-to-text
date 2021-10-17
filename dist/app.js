"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER = void 0;
require('dotenv').config();
var fs_1 = __importDefault(require("fs"));
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var v1_1 = __importDefault(require("ibm-watson/speech-to-text/v1"));
var auth_1 = require("ibm-watson/auth");
var chalk_1 = __importDefault(require("chalk"));
var APIKEYSPEECH = process.env.SPEECH_TO_TEXT_IAM_APIKEY;
var SPEECHURL = process.env.SPEECH_TO_TEXT_URL;
var PORT = process.env.PORT || '9999';
var app = (0, express_1.default)();
var speechToText = new v1_1.default({
    authenticator: new auth_1.IamAuthenticator({
        apikey: APIKEYSPEECH
    }),
    serviceUrl: "" + SPEECHURL
});
/**
 *
 * @param base64
 * @param extension
 * @param nameFile
 * @returns
 */
var listMimeTypeAndExtension = [
    { mimeType: 'audio/ogg', extencion: '.oga' },
    { mimeType: 'audio/webm', extencion: '.weba' },
    { mimeType: 'audio/basic', extencion: '.au' },
    { mimeType: 'audio/mpeg', extencion: '.mp3' },
    { mimeType: 'audio/flac', extencion: '.flac' },
    { mimeType: 'audio/wav', extencion: '.wav' }
];
var getFileExtension = function (mimeType) {
    return listMimeTypeAndExtension.find(function (file) { return file.mimeType === mimeType; });
};
var writeFile = function (base64, extension, nameFile) {
    if (nameFile === void 0) { nameFile = 'audio-transcrip'; }
    return new Promise(function (response, reject) {
        if (base64 === null || base64 === undefined || base64.length < 1) {
            response({ exit: true });
            return;
        }
        else if (extension === null || extension === undefined || extension.length < 1) {
            response({ exit: true });
            return;
        }
        else {
            var base64String = base64;
            var dotExtencion = getFileExtension(extension) === undefined ? false : getFileExtension(extension).extencion;
            if (dotExtencion === false) {
                response({ exit: true });
                return;
            }
            var namePath_1 = "" + nameFile + dotExtencion;
            base64String = base64String.split(';base64,').pop();
            fs_1.default.writeFile('speech/' + namePath_1, base64String, { encoding: 'base64' }, function (err) {
                if (err) {
                    console.error(err);
                    reject(false);
                }
                console.log(chalk_1.default.green('DOCUMENTO GUARDADO'));
                response({ created: true, path: namePath_1 });
            });
        }
    });
};
/**
 *
 * @param path
 * @param mimeType
 * @returns
 */
var proccesTranscript = function (path, mimeType) {
    if (mimeType === void 0) { mimeType = 'audio/ogg'; }
    return new Promise(function (resolve, reject) {
        speechToText.recognize({
            contentType: mimeType,
            audio: fs_1.default.createReadStream('speech/' + path),
            model: 'es-MX_NarrowbandModel'
        }).then(function (res) {
            console.log(chalk_1.default.blueBright('TRANSCRIPCION OBTENIDA'));
            var response = res.result.results;
            var trasncript = '';
            response.forEach(function (speech) {
                speech.alternatives.forEach(function (msg) {
                    trasncript = trasncript + " " + msg.transcript;
                });
            });
            resolve(trasncript);
        }).catch(function (err) { return reject(err); });
    });
};
/**
 *  SERVER INIT
 */
var SERVER = function () {
    middlewares();
    routes();
    listen();
};
exports.SERVER = SERVER;
var middlewares = function () {
    // middlewares
    app.use(express_1.default.json({ limit: '20mb' }));
    // LIMIT 20 MB
    app.use((0, cors_1.default)());
};
var listen = function () {
    app.listen(PORT, function () {
        console.log(chalk_1.default.blue("SERVER ON PORT " + PORT));
    });
};
var routes = function () {
    app.post('/thomas-speech', function (req, res) {
        var _a = req.body, audioBase64 = _a.audioBase64, mimeType = _a.mimeType;
        writeFile(audioBase64, mimeType).then(function (resFile) {
            if (resFile.exit) {
                res.send({
                    msg: 'DATO ERRONEO'
                });
                return;
            }
            proccesTranscript(resFile.path, mimeType).then(function (trasncript) {
                res.send({
                    msg: trasncript
                });
                fs_1.default.unlink('speech/' + resFile.path, function (err) {
                    if (err)
                        throw err;
                    console.log(chalk_1.default.red('ELIMINADO'));
                });
            }).catch(function (err) {
                res.send({
                    err: err
                });
            });
        }).catch(function (err) {
            res.send({
                err: err
            });
        });
    });
};
