ARG BASE=golang:1.13-alpine
FROM ${BASE} AS builder

ARG MAKE="make build"
ARG ALPINE_PKG_BASE="make git gcc libc-dev libsodium-dev zeromq-dev"
ARG ALPINE_PKG_EXTRA=""

LABEL Name=cloud-ui-go

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2018-2020: Intel'


RUN sed -e 's/dl-cdn[.]alpinelinux.org/nl.alpinelinux.org/g' -i~ /etc/apk/repositories

RUN apk update && apk add --no-cache ${ALPINE_PKG_BASE} ${ALPINE_PKG_EXTRA}

ENV GO111MODULE=on
WORKDIR /go/src/github.com/phanvanhai/cloud-ui-go

COPY go.mod .
COPY Makefile .

RUN make update

COPY . .
RUN ${MAKE}

FROM alpine

RUN apk --no-cache add ca-certificates zeromq
EXPOSE 4000

COPY --from=builder /go/src/github.com/phanvanhai/cloud-ui-go /go/src/github.com/phanvanhai/cloud-ui-go

WORKDIR /go/src/github.com/phanvanhai/cloud-ui-go/cmd/cloud-ui-server

ENTRYPOINT ["./cloud-ui-server","-conf=res/docker-mqtt/configuration.toml"]
