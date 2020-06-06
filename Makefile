#
# Copyright (c) 2018 Tencent
#
# SPDX-License-Identifier: Apache-2.0
#

.PHONY: build clean test run docker docker-push docker-multi

GO= GO111MODULE=on go
GOCGO=CGO_ENABLED=1 GO111MODULE=on go

MICROSERVICES=cmd/cloud-ui-server/cloud-ui-server
.PHONY: $(MICROSERVICES)

DOCKERS=docker_cloud_ui_go
.PHONY: $(DOCKERS)

VERSION=$(shell cat ./VERSION 2>/dev/null || echo 0.0.0)

GOFLAGS=-ldflags "-X github.com/phanvanhai/cloud-ui-go.Version=$(VERSION)"

GIT_SHA=$(shell git rev-parse HEAD)

build: $(MICROSERVICES)
	$(GO) build ./...

cmd/cloud-ui-server/cloud-ui-server:
	$(GO) build $(GOFLAGS) -o $@ ./cmd/cloud-ui-server

clean:
	rm -f $(MICROSERVICES)

test:
	GO111MODULE=on go test -coverprofile=coverage.out ./...
	GO111MODULE=on go vet ./...

prepare:

update:
	$(GO) mod download

run:
	cd cmd/cloud-ui-server && ./cloud-ui-server

docker: $(DOCKERS)

docker_cloud_ui_go:
	docker build --label "git_sha=$(GIT_SHA)" -t phanvanhai/docker-manager-tool-go:$(VERSION) .

docker-push:
	docker push \
	phanvanhai/docker-manager-tool-go:$(VERSION)


docker-multi:
	docker buildx build --platform linux/arm64,linux/amd64 -t phanvanhai/docker-manager-tool-go:$(VERSION) --push .