const express = require('express');
const app = express();
const logger = require("morgan");


app.use(logger('dev'));

app.use("/", express.static(__dirname + '/dist'));

express.static.mime.types["wasm"] = "application/wasm";

app.listen(3000, () => console.log('server @ http://localhost:3000'));
