FROM golang:1.21-alpine AS multistage

WORKDIR /src
COPY ./apps/platform .
RUN go build

##

FROM alpine:latest
COPY --from=multistage /src/uesio .
COPY ./apps/platform/seed ./seed
COPY ./apps/platform/migrations ./migrations
COPY ./libs/apps ./libs/apps
COPY ./apps/platform/platform ./platform
COPY ./dist/ui ./dist/ui
COPY ./dist/vendor ./dist/vendor

ARG GITSHA
ENV GITSHA ${GITSHA}

EXPOSE 3000

CMD ["./uesio", "serve"]
