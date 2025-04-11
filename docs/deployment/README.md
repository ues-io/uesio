# Deploy Uesio in your environment

## Testing

The Uesio app is distributed via a single Docker image, which you can pull and run locally:

```
docker pull ghcr.io/ues-io/uesio:latest
```

For local testing, just running `npm run start` should be fine.

In Production, you may also want to run the Uesio `worker` command as a separate process. This handles asynchronous work, such as Uesio usage data aggregation, but in the future other asynchronous tasks may be added to this as well.

## Run locally

To run the app locally with Docker Compose, simply run the following:

```
npm run in-docker
open http://studio.uesio.localhost:3000
```

## Run in Production

### AWS Elastic Container Service (ECS)

An [example ECS Task Definition]([./aws-ecs/taskdefinition-web-app.json]) is provided in the `aws-ecs` directory.
