\# Voyage — AI Travel Planner



Voyage is a local AI travel planner that takes a city and builds a two-day itinerary using current weather, real places from OpenStreetMap, and a locally running language model.



I built this project while learning how to connect APIs, n8n workflows, structured JSON, validation and local AI models into one working application.



\## What it does



The user enters a city in the frontend and Voyage sends the request to an n8n webhook.



The workflow then:



1\. Resolves the city and gets its coordinates, country and timezone.

2\. Gets the current weather for the location.

3\. Finds nearby places using OpenStreetMap data through the Overpass API.

4\. Converts the API response into a simpler places structure.

5\. Sends the available places and weather information to a local Qwen model.

6\. Validates the places selected by the model against the original place data.

7\. Sends only the validated places to a second Qwen step to build the itinerary.

8\. Validates the generated itinerary for invalid or repeated places.

9\. Maps the final place IDs back to their original place information.

10\. Returns a structured travel response to the frontend.



The frontend then displays the generated itinerary together with the weather information.



\---



\## Architecture



```text

&#x20;                        ┌─────────────────┐

&#x20;                        │    Frontend     │

&#x20;                        │  HTML / CSS / JS│

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                            POST { city }

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │   n8n Webhook   │

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                   ┌─────────────┴─────────────┐

&#x20;                   │                           │

&#x20;                   ▼                           ▼

&#x20;            ┌──────────────┐           ┌───────────────┐

&#x20;            │  Geocoding   │           │    Places     │

&#x20;            │  Open-Meteo  │           │ Overpass API  │

&#x20;            └──────┬───────┘           └───────┬───────┘

&#x20;                   │                           │

&#x20;                   ▼                           ▼

&#x20;            ┌──────────────┐           ┌───────────────┐

&#x20;            │  Weather DTO │           │   Places DTO  │

&#x20;            └──────┬───────┘           └───────┬───────┘

&#x20;                   │                           │

&#x20;                   └─────────────┬─────────────┘

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │  Qwen / Ollama  │

&#x20;                        │ Place Selection │

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │ Validate Places │

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │  Qwen / Ollama  │

&#x20;                        │ Itinerary Plan  │

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │    Validate     │

&#x20;                        │    Itinerary    │

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │ Final Travel DTO│

&#x20;                        └────────┬────────┘

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        ┌─────────────────┐

&#x20;                        │    Frontend     │

&#x20;                        │  Render Result  │

&#x20;                        └─────────────────┘

```



\---



\## Tech stack



\### Frontend



\- HTML

\- CSS

\- JavaScript



\### Automation



\- n8n

\- Docker



\### AI



\- Ollama

\- Qwen 3.5 4B



\### APIs and data



\- Open-Meteo Geocoding API

\- Open-Meteo Weather API

\- OpenStreetMap

\- Overpass API



\### Other



\- JavaScript for transformation and validation

\- Git / GitHub for version control



\---



\## How the workflow works



\### 1. Webhook



The frontend sends a POST request containing the selected city.



Example:



```json

{

&#x20; "city": "Paris"

}

```



The workflow receives the city from:



```text

$json.body.city

```



\---



\### 2. City geocoding



The city is sent to the Open-Meteo geocoding service.



The response is used to obtain information such as:



\- city

\- country

\- latitude

\- longitude

\- timezone



This gives the rest of the workflow a consistent location to work with.



\---



\### 3. Weather



The coordinates from the geocoding step are used to request current weather information.



The workflow currently uses:



\- temperature

\- humidity

\- wind speed



The raw API response is converted into a smaller weather object before being passed further through the workflow.



\---



\### 4. Place discovery



The workflow uses the Overpass API to search OpenStreetMap data around the selected location.



The search can return places such as:



\- museums

\- galleries

\- parks

\- attractions

\- historic places

\- memorials

\- zoos

\- theme parks



The raw place data is then converted into a simpler structure.



Each place can contain:



```json

{

&#x20; "id": "place\_123",

&#x20; "name": "Example Museum",

&#x20; "category": "museum",

&#x20; "latitude": 48.123,

&#x20; "longitude": 2.456,

&#x20; "openingHours": null,

&#x20; "website": null

}

```



\---



\### 5. Place selection with Qwen



The first Qwen step receives the available places and current weather.



Its job is to select a smaller set of places that can be used for the itinerary.



The model is instructed to use the provided place IDs rather than creating places itself.



This is important because the model should choose from real places returned by the place search rather than inventing attractions.



\---



\### 6. Selected place validation



The selected place IDs are checked against the original validated place list.



If the model returns an ID that does not exist in the supplied data, it is rejected.



Duplicate places are also handled here.



This creates a boundary between the model's output and the data that the rest of the workflow is allowed to use.



\---



\### 7. Itinerary generation



The validated places and weather information are sent to a second Qwen step.



The second model generates:



\- destination

\- summary

\- two days

\- activity times

\- place IDs

\- reasons for the choices



The model is instructed not to invent places or repeat the same place.



\---



\### 8. Itinerary validation



The generated itinerary is checked using JavaScript.



The validation checks things such as:



\- number of days

\- whether activity place IDs exist

\- duplicate places

\- number of activities per day



Invalid activities are removed and the result can be retried when the itinerary does not satisfy the workflow's requirements.



The important idea here is that the LLM output is not treated as automatically correct.



\---



\### 9. Final Travel DTO



Once the itinerary has passed validation, the place IDs are mapped back to the original place data.



The final response combines:



\- destination

\- country

\- timezone

\- weather

\- activity times

\- place names

\- categories

\- coordinates

\- opening hours

\- websites

\- reasons



This gives the frontend a predictable JSON structure to render.



\---



\## Example final response



A simplified version of the response sent to the frontend looks like:



```json

{

&#x20; "success": true,

&#x20; "destination": {

&#x20;   "city": "Berlin",

&#x20;   "country": "Germany",

&#x20;   "timezone": "Europe/Berlin"

&#x20; },

&#x20; "weather": {

&#x20;   "temperature": 19.4,

&#x20;   "humidity": 77,

&#x20;   "windSpeed": 9

&#x20; },

&#x20; "itinerary": {

&#x20;   "destination": "Berlin, Germany",

&#x20;   "summary": "A two-day itinerary focusing on history and art.",

&#x20;   "days": \[

&#x20;     {

&#x20;       "day": 1,

&#x20;       "activities": \[

&#x20;         {

&#x20;           "time": "Morning",

&#x20;           "placeId": "place\_7574",

&#x20;           "name": "Example Place",

&#x20;           "category": "memorial",

&#x20;           "reason": "..."

&#x20;         }

&#x20;       ]

&#x20;     }

&#x20;   ]

&#x20; }

}

```



The actual number and type of places depend on the data returned for the requested city.



\---



\## Why the workflow uses validation



One of the main things I wanted to learn with this project was how to make an LLM workflow more reliable.



An LLM can return something that looks correct but does not necessarily match the data provided to it.



For example, it could:



\- invent a place ID

\- repeat a place

\- return incomplete activity data

\- produce an unexpected structure



Instead of trusting the model output directly, the workflow checks it against the original data.



The basic flow is:



```text

Real API data

&#x20;     ↓

LLM selection

&#x20;     ↓

Validation

&#x20;     ↓

Validated data

&#x20;     ↓

LLM itinerary

&#x20;     ↓

Validation

&#x20;     ↓

Final response

```



This was one of the main design decisions in the project.



\---



\## Why Qwen runs locally



The LLM steps use Ollama with the Qwen 3.5 4B model rather than a hosted AI API.



This kept the project inexpensive to experiment with and also gave me a chance to learn how a Dockerized n8n workflow can communicate with a model running locally.



The n8n container accesses Ollama through:



```text

http://host.docker.internal:11434

```



\---



\## Running the project locally



This version is intended to run locally.



The main components are:



```text

Browser

&#x20;  ↓

Frontend local server

&#x20;  ↓

n8n running in Docker

&#x20;  ↓

External APIs + local Ollama

```



See \[docs/setup.md](docs/setup.md) for the setup process.



\---



\## Project structure



```text

voyage-ai-travel-planner/

│

├── docs/

│   ├── architecture.png

│   ├── setup.md

│   ├── limitations.md

│   └── screenshots/

│       ├── home.png

│       ├── loading.png

│       └── result.png

│

├── frontend/

│   ├── index.html

│   ├── app.js

│   ├── api.js

│   ├── config.js

│   ├── clocks.js

│   ├── render.js

│   └── ...

│

├── n8n/

│   ├── README.md

│   └── voyage-workflow.json

│

├── .gitignore

├── LICENSE

└── README.md

```



\---



\## Screenshots



\### Home



!\[Voyage home](docs/screenshots/home.png)



\### Building an itinerary



!\[Voyage loading](docs/screenshots/loading.png)



\### Generated itinerary



!\[Voyage result](docs/screenshots/result.png)



\---



\## Current limitations



This is a learning and portfolio project rather than a production travel service.



Some known limitations are:



\- Weather is currently based on current weather data rather than a full multi-day forecast.

\- Opening hours are available when present in the source data, but the itinerary does not currently verify activity times against them.

\- Actual walking or public transport travel times are not calculated.

\- Place information depends on OpenStreetMap coverage and can sometimes be incomplete.

\- The local 4B model can occasionally generate invalid or incomplete itinerary data.

\- The application currently generates a two-day itinerary.

\- The application currently runs locally rather than as a public service.



More details are in \[docs/limitations.md](docs/limitations.md).



\---



\## What I learned



The main focus of this project was learning how different systems can be connected into one reliable workflow.



Some of the concepts I worked with were:



\- Webhooks

\- REST APIs

\- JSON

\- n8n expressions

\- API responses

\- Data transformation

\- DTO-style intermediate structures

\- LLM structured output

\- Validation of AI-generated data

\- Retry handling

\- Docker

\- Docker networking

\- Frontend/backend communication

\- CORS

\- Local LLM integration

\- Git and GitHub



\---



\## Future improvements



Some things I would like to explore in future versions:



\- Use forecast data instead of only current weather.

\- Calculate travel time between places.

\- Take opening hours into account when assigning activity times.

\- Improve geographic clustering of activities.

\- Improve itinerary quality and model reliability.

\- Add user preferences such as trip style and interests.

\- Deploy the workflow and frontend so the application can be used without a local setup.



\---



\## Status



\*\*Version 1 — Local working prototype\*\*



The current version is mainly a learning and portfolio project. The goal was to get the complete flow working end-to-end before adding more complexity.

