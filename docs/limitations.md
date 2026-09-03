## Current Limitations



Voyage is currently a local prototype, so there are a few known limitations.



## Weather



The workflow uses current weather data. It does not currently build the itinerary around a multi-day weather forecast.



## Opening hours



Opening hours may be available from OpenStreetMap, but the current itinerary generation does not verify activity times against opening hours.



## Travel time



The itinerary uses the coordinates of places when planning, but it does not currently calculate actual walking or public transport travel times between activities.



## Place data



Place availability and metadata depend on OpenStreetMap coverage. Some places may have missing websites or opening hours.



## LLM reliability



The local Qwen model can occasionally generate invalid or incomplete itinerary data. Validation and retry handling were added to reduce the impact of this.



## Local deployment



The current setup runs locally using Docker, n8n and Ollama. It has not been deployed as a public service yet.



