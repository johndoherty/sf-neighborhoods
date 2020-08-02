import * as https from 'https';
import { MultiPolygon } from "geojson"
import * as fs from 'fs';

interface Sample {
  area: string
  id: string
  population: number[]
  cases: number[]
  deaths: number[]
  lastUpdate: number
  multipolygon?: MultiPolygon
}

interface InputJSON {
  area_type?: string
  id?: string
  count?: string
  rate?: string
  deaths?: string
  acs_population?: string
  last_updated_at?: string
  multipolygon?: MultiPolygon
}

interface InputData {
  area_type?: string
  id?: string
  count?: number
  rate?: number
  deaths?: number
  acs_population?: number
  last_updated_at?: string
  multipolygon?: MultiPolygon
}

function getInputID(sample: InputData): string {
  const id = sample.id ? sample.id : null
  const area = sample.area_type ? sample.area_type : null

  return JSON.stringify({id, area})
}

function getSampleID(sample: Sample): string {
  return JSON.stringify({id: sample.id, area: sample.area})
}

function createEmptySample(input: InputData): Sample | null {
  const {area_type, id, count, rate, deaths, acs_population, last_updated_at, multipolygon} = input

  if (!area_type || !id) {
    return null
  }

  return {
    area: area_type,
    id,
    population: [],
    cases: [],
    deaths: [],
    lastUpdate: 0,
    multipolygon
  }
}

function check<T>(x: T | null | undefined): x is T {
  return (x !== null && x !== undefined)
}

function append(inputData: InputData[]) {
  const dataFile: string = 'data.json'
  let historicalDataByID = new Map<string, Sample>()

  if (fs.existsSync(dataFile)) {
    const historicalDataJSON = fs.readFileSync(dataFile, 'utf8')
    const historicalData = JSON.parse(historicalDataJSON) as Sample[]
    historicalDataByID = new Map<string, Sample>(historicalData.map((s): [string, Sample] => [getSampleID(s), s]))
  }

  for (const input of inputData) {
    const id = getInputID(input)
    let sample: Sample | undefined | null = historicalDataByID.get(id)

    if (!sample) {
      sample = createEmptySample(input)

      if (!sample) {
        continue
      }
    }

    const {count, rate, deaths, acs_population, last_updated_at} = input

    if (check(count) && check(deaths) && check(acs_population) && check(last_updated_at)) {
      const lastTime = sample.lastUpdate
      const inputUpdate = new Date(Date.parse(last_updated_at))
      const inputTime = inputUpdate.getTime()

      if (inputTime > lastTime) {
        sample.population.push(acs_population)
        sample.cases.push(count)
        sample.deaths.push(deaths)
        sample.lastUpdate = inputTime
      }
    }

    historicalDataByID.set(id, sample)
  }

  const samples: Sample[] = []
  historicalDataByID.forEach(value => samples.push(value))
  fs.writeFileSync(dataFile, JSON.stringify(samples), {encoding: 'utf8'})
}

function parseInput(input: InputJSON): InputData {
  return {
    area_type: input.area_type,
    id: input.id,
    count: input.count ? parseFloat(input.count) : undefined,
    rate: input.rate ? parseFloat(input.rate) : undefined,
    deaths: input.deaths ? parseFloat(input.deaths) : undefined,
    acs_population: input.acs_population ? parseFloat(input.acs_population) : undefined,
    last_updated_at: input.last_updated_at,
    multipolygon: input.multipolygon,
  }
}

const useLiveData = true

if (useLiveData) {
  const limit = 5000
  const apiToken = "Xvqbk3ezEoBQuFZDu29MINvqG"
  const url = `https://data.sfgov.org/resource/tpyr-dvnc.json?$limit=${limit}&$$app_token=${apiToken}`

  https.get(url, (resp) => {
    let data = ''
    resp.on('data', (chunk) => data += chunk)
    resp.on('end', () => {
      const inputJSON: InputJSON[] = JSON.parse(data)
      const inputData: InputData[] = inputJSON.map(parseInput)
      append(inputData)
    })
  }).on("error", (err) => {
    console.log("Error: " + err.message)
  });
} else {
  const text = fs.readFileSync('test.json', 'utf8')
  const inputJSON: InputJSON[] = JSON.parse(text)
  const inputData: InputData[] = inputJSON.map(parseInput)
  append(inputData)
}