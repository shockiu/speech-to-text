"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var v1_2 = __importDefault(require("ibm-watson/text-to-speech/v1"));
var auth_1 = require("ibm-watson/auth");
var chalk_1 = __importDefault(require("chalk"));
// API KEY SPEECH
var APIKEYSPEECH = process.env.SPEECH_TO_TEXT_IAM_APIKEY;
var SPEECHURL = process.env.SPEECH_TO_TEXT_URL;
// API KEY TEXT
var APIKEYTEXT = process.env.TEXT_TO_SPEECH_IAM_APIKEY;
var TEXTURL = process.env.TEXT_TO_SPEECH_URL;
var PORT = process.env.PORT || '9999';
var app = (0, express_1.default)();
var iamAuthenticatorSpeech = new auth_1.IamAuthenticator({
    apikey: APIKEYSPEECH
});
var speechToText = new v1_1.default({
    authenticator: iamAuthenticatorSpeech,
    serviceUrl: "" + SPEECHURL
});
var textToSpeech = new v1_2.default({
    authenticator: new auth_1.IamAuthenticator({
        apikey: APIKEYTEXT
    }),
    serviceUrl: "" + TEXTURL
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
    app.post('/thomas-text', function (req, res) {
        var msg = req.body.msg;
        textToSpeech.synthesize({
            text: msg,
            voice: 'es-ES_EnriqueV3Voice',
            accept: 'audio/ogg'
        }).then(function (response) { return __awaiter(void 0, void 0, void 0, function () {
            var bufs, result;
            return __generator(this, function (_a) {
                bufs = [];
                response.result.on('data', function (data) {
                    bufs.push(data);
                });
                response.result.on('end', function () {
                    result = Buffer.concat(bufs);
                    fs_1.default.writeFileSync('text/audioprueba.ogg', result);
                    fs_1.default.readFile('text/audioprueba.ogg', { encoding: 'base64' }, function (err, data) {
                        if (err)
                            throw err;
                        // EL BASE 64 SIN LA URI
                        console.log(data);
                        res.send({
                            msg: data
                        });
                    });
                });
                return [2 /*return*/];
            });
        }); });
    });
};
