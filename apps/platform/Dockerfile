FROM golang:1.24.4-alpine AS multistage

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
# alpine:latest does not include ca-certificates (only ca-certificates-bundle 
# is included) so we must install it to get update-ca-certificates. This is
# needed so that SSL verification on the container itself can be done
# when the server is making "outbound" http requests, which could include 
# itself (e.g., in our test suite). Having update-ca-certificates available
# on the image provides a standard and supportable way for consumers of the 
# image to install their own ssl certificates and register them as needed. 
# This is typically only required for self-signed certificates and/or 
# certificates that cannot be validated on the internet (e.g., custom
# CA roots.)
# See https://pkgs.alpinelinux.org/contents?name=ca-certificates-bundle&repo=main&branch=edge&arch=x86
# and https://pkgs.alpinelinux.org/contents?name=ca-certificates&repo=main&branch=edge&arch=x86
RUN apk add --upgrade --no-cache ca-certificates && update-ca-certificates

ARG BUILD_VERSION
ENV UESIO_BUILD_VERSION=${BUILD_VERSION}
LABEL build_version=${BUILD_VERSION}

EXPOSE 3000

CMD ["./uesio", "serve"]
