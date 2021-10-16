"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER = exports.writeFile = void 0;
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
var writeFile = function (base64) {
    return new Promise(function (response, reject) {
        var base64String = base64;
        var namePath = 'audio-prueba.oga';
        base64String = base64String.split(';base64,').pop();
        fs_1.default.writeFile('speech/' + namePath, base64String, { encoding: 'base64' }, function (err) {
            if (err) {
                console.error(err);
                reject(false);
            }
            console.log('file saved to ');
            response({ created: true, path: namePath });
        });
    });
};
exports.writeFile = writeFile;
var SERVER = function () {
    middlewares();
    routes();
    listen();
};
exports.SERVER = SERVER;
var middlewares = function () {
    // middlewares
    app.use(express_1.default.json({ limit: '20mb' }));
    app.use((0, cors_1.default)());
    /**
     * LIMITE DE 20MB por base 64
     */
};
var listen = function () {
    app.listen(PORT, function () {
        console.log(chalk_1.default.blue.bgYellow("SERVER ON PORT " + PORT));
    });
};
var routes = function () {
    app.post('/V1-thomas-speech', function (req, response_) {
        var audioBase64 = req.body.audioBase64;
        (0, exports.writeFile)(audioBase64).then(function (resFile) {
            console.log(resFile);
            speechToText.recognize({
                contentType: 'audio/ogg',
                audio: fs_1.default.createReadStream('speech/' + resFile.path),
                model: 'es-MX_NarrowbandModel'
            }).then(function (res) {
                var response = res.result.results;
                var trasncript = '';
                response.forEach(function (speech) {
                    console.log(speech.alternatives);
                    speech.alternatives.forEach(function (msg) {
                        trasncript = trasncript + " " + msg.transcript;
                    });
                });
                response_.send({
                    msg: trasncript
                });
                fs_1.default.unlink('speech/' + resFile.path, function (err) {
                    if (err)
                        throw err;
                    console.log('ELIMINADO');
                });
            });
        });
    });
};
