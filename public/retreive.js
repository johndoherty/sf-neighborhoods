"use strict";
exports.__esModule = true;
var https = require("https");
var fs = require("fs");
function getInputID(sample) {
    var id = sample.id ? sample.id : null;
    var area = sample.area_type ? sample.area_type : null;
    return JSON.stringify({ id: id, area: area });
}
function getSampleID(sample) {
    return JSON.stringify({ id: sample.id, area: sample.area });
}
function createEmptySample(input) {
    var area_type = input.area_type, id = input.id, count = input.count, rate = input.rate, deaths = input.deaths, acs_population = input.acs_population, last_updated_at = input.last_updated_at, multipolygon = input.multipolygon;
    if (!area_type || !id) {
        return null;
    }
    return {
        area: area_type,
        id: id,
        population: [],
        cases: [],
        deaths: [],
        lastUpdate: 0,
        multipolygon: multipolygon
    };
}
function check(x) {
    return (x !== null && x !== undefined);
}
function append(inputData) {
    var dataFile = 'data.json';
    var historicalDataByID = new Map();
    if (fs.existsSync(dataFile)) {
        var historicalDataJSON = fs.readFileSync(dataFile, 'utf8');
        var historicalData = JSON.parse(historicalDataJSON);
        historicalDataByID = new Map(historicalData.map(function (s) { return [getSampleID(s), s]; }));
    }
    for (var _i = 0, inputData_1 = inputData; _i < inputData_1.length; _i++) {
        var input = inputData_1[_i];
        var id = getInputID(input);
        var sample = historicalDataByID.get(id);
        if (!sample) {
            sample = createEmptySample(input);
            if (!sample) {
                continue;
            }
        }
        var count = input.count, rate = input.rate, deaths = input.deaths, acs_population = input.acs_population, last_updated_at = input.last_updated_at;
        if (check(count) && check(deaths) && check(acs_population) && check(last_updated_at)) {
            var lastTime = sample.lastUpdate;
            var inputUpdate = new Date(Date.parse(last_updated_at));
            var inputTime = inputUpdate.getTime();
            if (inputTime > lastTime) {
                sample.population.push(acs_population);
                sample.cases.push(count);
                sample.deaths.push(deaths);
                sample.lastUpdate = inputTime;
            }
        }
        historicalDataByID.set(id, sample);
    }
    var samples = [];
    historicalDataByID.forEach(function (value) { return samples.push(value); });
    fs.writeFileSync(dataFile, JSON.stringify(samples), { encoding: 'utf8' });
}
function parseInput(input) {
    return {
        area_type: input.area_type,
        id: input.id,
        count: input.count ? parseFloat(input.count) : undefined,
        rate: input.rate ? parseFloat(input.rate) : undefined,
        deaths: input.deaths ? parseFloat(input.deaths) : undefined,
        acs_population: input.acs_population ? parseFloat(input.acs_population) : undefined,
        last_updated_at: input.last_updated_at,
        multipolygon: input.multipolygon
    };
}
var useLiveData = true;
if (useLiveData) {
    var limit = 5000;
    var apiToken = "Xvqbk3ezEoBQuFZDu29MINvqG";
    var url = "https://data.sfgov.org/resource/tpyr-dvnc.json?$limit=" + limit + "&$$app_token=" + apiToken;
    https.get(url, function (resp) {
        var data = '';
        resp.on('data', function (chunk) { return data += chunk; });
        resp.on('end', function () {
            var inputJSON = JSON.parse(data);
            var inputData = inputJSON.map(parseInput);
            append(inputData);
        });
    }).on("error", function (err) {
        console.log("Error: " + err.message);
    });
}
else {
    var text = fs.readFileSync('test.json', 'utf8');
    var inputJSON = JSON.parse(text);
    var inputData = inputJSON.map(parseInput);
    append(inputData);
}
