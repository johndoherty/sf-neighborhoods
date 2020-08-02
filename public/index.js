"use strict";
exports.__esModule = true;
var xhr_1 = require("xhr");
xhr_1["default"]({
    method: "GET",
    url: "https://data.sfgov.org/resource/tpyr-dvnc.json",
    headers: {
        "Content-Type": "application/json",
        "$$app_token": "akcpcmlhsv0jfpxfiud67oese"
    }
}, function (err, resp, body) {
    console.log(err);
    console.log(resp);
});
