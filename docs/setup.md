\# Local Setup



Voyage currently runs as a local application using a frontend, n8n in Docker, Ollama and a few external APIs.



This guide describes the setup used during development.



\---



\## Requirements



You will need:



\- Windows, macOS or Linux

\- Docker Desktop

\- n8n

\- Ollama

\- Qwen 3.5 4B

\- A local web server for the frontend

\- Internet access for the external APIs



The project was developed locally with Docker Desktop on Windows.



\---



\## 1. Start Ollama



Install Ollama and make sure the Ollama service is running.



Download the model used by the workflow:



```powershell

ollama pull qwen3.5:4b

```



Check that the model is available:



```powershell

ollama list

```



You should see:



```text

qwen3.5:4b

```



The workflow uses the Ollama API on:



```text

http://localhost:11434

```



Because n8n is running inside Docker, the workflow accesses the host machine using:



```text

http://host.docker.internal:11434

```



\---



\## 2. Start n8n



n8n is run locally inside Docker.



The local setup uses port `5678`.



The n8n interface should be available at:



```text

http://localhost:5678

```



The Docker container is named:



```text

n8n

```



The n8n data directory is kept outside the GitHub repository so that local credentials, executions and instance data are not committed.



\---



\## 3. Import the workflow



Open:



```text

http://localhost:5678

```



Import the workflow from:



```text

n8n/voyage-workflow.json

```



The exported workflow contains the complete automation used by Voyage.



After importing it, check the nodes and make sure the required configuration is available.



\---



\## 4. Workflow webhook



The frontend communicates with the n8n webhook using a POST request.



The endpoint used by the local version is:



```text

http://localhost:5678/webhook/travel-weather

```



The request body should contain:



```json

{

&#x20; "city": "Paris"

}

```



The webhook reads the city from:



```text

$json.body.city

```



The workflow should be activated before using the production webhook URL from the frontend.



\---



\## 5. Frontend



The frontend is contained in:



```text

frontend/

```



It is a simple HTML/CSS/JavaScript application and does not require a separate backend server.



A local development server is recommended instead of opening `index.html` directly.



For example, using VS Code with Live Server:



```text

http://localhost:5501

```



The frontend sends the selected city to the n8n webhook.



\---



\## 6. Frontend API configuration



The webhook URL is kept in the frontend configuration file.



The local configuration is:



```javascript

const API\_URL = "http://localhost:5678/webhook/travel-weather";

```



If n8n is running on another machine or the workflow is deployed somewhere else, this URL needs to be changed.



\---



\## 7. CORS



During local development the frontend and n8n run on different ports:



```text

Frontend:

http://localhost:5501



n8n:

http://localhost:5678

```



Because they have different origins, the browser requires the n8n response to allow the frontend origin.



The local setup therefore allows:



```text

http://localhost:5501

```



If the frontend is served from another port or domain, the CORS configuration needs to be updated accordingly.



\---



\## 8. External APIs



The workflow uses external services for location, weather and place data.



\### Open-Meteo



Used for:



\- city geocoding

\- latitude and longitude

\- country

\- timezone

\- current weather



\### OpenStreetMap / Overpass



Used for:



\- discovering nearby places

\- place names

\- categories

\- coordinates

\- opening hours when available

\- websites when available



These services are queried by the n8n workflow.



\---



\## 9. Test the workflow



There are two useful ways to test the workflow.



\### Test inside n8n



Use the webhook's test functionality while developing the workflow.



When using the test webhook, n8n requires the workflow to be listening for the test event.



The test request should contain:



```json

{

&#x20; "city": "Berlin"

}

```



Check the output of each major stage while debugging.



\---



\### Test from the frontend



Once the workflow is active:



1\. Start n8n.

2\. Make sure Ollama is running.

3\. Make sure Qwen 3.5 4B is available.

4\. Start the frontend server.

5\. Open the frontend.

6\. Enter a city.

7\. Click \*\*Plan Trip\*\*.



For example:



```text

Paris

```



The frontend should send:



```json

{

&#x20; "city": "Paris"

}

```



to the n8n webhook.



\---



\## 10. Expected workflow flow



A successful request should move through approximately these stages:



```text

Frontend

&#x20;  ↓

Webhook

&#x20;  ↓

Geocoding

&#x20;  ↓

Weather

&#x20;  ↓

Place search

&#x20;  ↓

Places DTO

&#x20;  ↓

Qwen place selection

&#x20;  ↓

Selected place validation

&#x20;  ↓

Qwen itinerary generation

&#x20;  ↓

Itinerary validation

&#x20;  ↓

Final Travel DTO

&#x20;  ↓

Webhook response

&#x20;  ↓

Frontend

```



\---



\## 11. Troubleshooting



\### The frontend cannot connect to n8n



Check:



\- n8n is running

\- the workflow is active

\- the webhook URL is correct

\- the frontend is using the correct port

\- the browser is not reporting a CORS error



The local webhook should be:



```text

http://localhost:5678/webhook/travel-weather

```



\---



\### n8n receives the request but the city is missing



The production webhook receives the frontend request body under:



```text

$json.body

```



The city should therefore be accessed as:



```text

$json.body.city

```



rather than:



```text

$json.query.city

```



The latter is for a URL query parameter such as:



```text

?city=Paris

```



\---



\### The test webhook returns 404



When testing a webhook in n8n, the workflow needs to be listening for the test event.



Click:



```text

Listen for test event

```



and then send the request.



The test webhook is temporary and is different from the production webhook.



\---



\### Ollama errors



Make sure Ollama is running.



Check the available models:



```powershell

ollama list

```



The workflow currently expects:



```text

qwen3.5:4b

```



If the model is missing:



```powershell

ollama pull qwen3.5:4b

```



\---



\### Itinerary validation fails



The LLM output is validated before the final response is created.



A validation failure can happen if the model returns:



\- a missing place ID

\- a place ID that was not supplied by the place search

\- a duplicate place

\- an invalid activity structure

\- an insufficient number of activities



The workflow includes retry handling for some invalid generations.



Because the project uses a relatively small local model, occasional invalid generations are possible.



\---



\### Some cities work while others fail



Place data from OpenStreetMap can vary significantly between locations.



A city may return:



\- fewer useful places

\- incomplete metadata

\- missing websites

\- missing opening hours

\- unusual categories



The local Qwen model can also behave differently depending on the number and quality of places returned.



This is one of the current limitations of the prototype.



\---



\## 12. Keeping secrets out of Git



The exported workflow should not contain personal credentials or API keys.



Do not commit:



```text

.env

credentials

n8n/data/

```



or any other file containing private credentials.



The local n8n instance stores its own data separately from this repository.



\---



\## 13. Repository structure



The relevant project structure is:



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

│   └── frontend files

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



\## 14. Notes



This setup is intended for development and demonstration.



It is not currently a production deployment.



For a future deployed version, the main changes would be:



\- hosted n8n

\- hosted frontend

\- HTTPS

\- proper environment variables

\- production CORS configuration

\- authentication where required

\- better error handling

\- monitoring

\- a hosted or separately deployed AI model/API

