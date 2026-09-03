# n8n Workflow

This folder contains the n8n workflow used by Voyage.

## Workflow

`voyage-workflow.json` is an exported copy of the workflow used to build and test the travel planner.

The workflow takes a city from the frontend and handles:

- City geocoding
- Current weather retrieval
- Place discovery
- Place filtering and selection
- AI-based itinerary generation
- AI output validation
- Retry handling
- Final travel response formatting

## Importing the workflow

1. Start a local n8n instance.
2. Open the n8n editor.
3. Use **Import from File**.
4. Select:

```text
voyage-workflow.json
```

5. Check the API and Ollama configuration.
6. Activate the workflow before using the production webhook.

## Local AI

The workflow uses Ollama with:

```text
qwen3.5:4b
```

The model is used for:

1. Selecting suitable places from the places returned by the API.
2. Creating the two-day itinerary from the validated places.

## Important

The exported workflow is provided as a reference and for local reproduction of the project.

Credentials, local n8n data and other machine-specific configuration are not included in this repository.