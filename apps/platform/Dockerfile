FROM golang:1.19-alpine AS multistage

WORKDIR /src
COPY ./apps/platform .
RUN go build

##

FROM alpine:latest
COPY --from=multistage /src/uesio .
COPY ./dist ./dist
COPY ./libs/apps ./libs/apps
COPY ./apps/platform/platform ./platform
COPY ./apps/platform/fonts ./fonts
COPY ./apps/platform/seed ./seed
EXPOSE 3000
CMD ["./uesio", "serve"]
