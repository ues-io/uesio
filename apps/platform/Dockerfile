FROM golang:1.15

WORKDIR /location/of/source/code
COPY ./dist ../../dist
COPY ./libs/uesioapps ../../libs/uesioapps
COPY ./apps/platform .
RUN go build
CMD ["./uesio", "serve"]

EXPOSE 3000
