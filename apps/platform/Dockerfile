FROM golang:1.24.1-alpine AS multistage

WORKDIR /src
RUN go env -w GOMODCACHE=/root/.cache/go-build
COPY ./apps/platform/go.mod ./apps/platform/go.sum ./
RUN --mount=type=cache,target=/root/.cache/go-build go mod download
COPY ./apps/platform .
RUN --mount=type=cache,target=/root/.cache/go-build go build

##

FROM alpine:latest
COPY --from=multistage /src/uesio .
COPY ./apps/platform/seed ./seed
COPY ./apps/platform/migrations ./migrations
COPY ./libs/apps ./libs/apps
COPY ./apps/platform/platform ./platform
COPY ./dist/ui ./dist/ui
COPY ./dist/vendor ./dist/vendor

ARG BUILD_VERSION
# TODO: BUILD_VERSION variable should change to have UESIO prefix
ENV BUILD_VERSION=${BUILD_VERSION}
LABEL build_version=${BUILD_VERSION}

EXPOSE 3000

CMD ["./uesio", "serve"]
