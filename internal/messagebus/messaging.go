//
// Copyright (c) 2020 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

package messagebus

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/phanvanhai/cloud-ui-go/internal/configs"
	"github.com/phanvanhai/cloud-ui-go/internal/pubsub"

	"github.com/edgexfoundry/go-mod-messaging/messaging"
	"github.com/edgexfoundry/go-mod-messaging/pkg/types"
)

// Constants related to the possible content types supported by the APIs
const (
	ContentType     = "Content-Type"
	ContentTypeCBOR = "application/cbor"
	ContentTypeJSON = "application/json"
	ContentTypeYAML = "application/x-yaml"
	ContentTypeText = "text/plain"
)

const ChanSizeDefault = 10

type Content struct {
	Service string `json:"Service, omitempty"`
	Method  string `json:"Method, omitempty"`
	Path    string `json:"Path, omitempty"`
	Body    string `json:"Body, omitempty"`
	Error   string `json:"Error, omitempty"`
}

// type BusClient struct {
// 	Client           messaging.MessageClient
// 	SubscribeChannel types.TopicChannel
// 	PulishTopic      string
// 	MessageErrors    chan error
// }

// var Client *BusClient

// // Initialize ...
// func Initialize(config *configs.Config) error {
// 	log.Printf(fmt.Sprintf("Initializing Message Bus Trigger for '%s'", config.MessageBus.Type))

// 	client, err := messaging.NewMessageClient(config.MessageBus)
// 	if err != nil {
// 		return err
// 	}

// 	topics := []types.TopicChannel{{Topic: config.Binding.SubscribeTopic, Messages: make(chan types.MessageEnvelope)}}
// 	messageErrors := make(chan error)
// 	err = client.Connect()
// 	if err != nil {
// 		return err
// 	}
// 	client.Subscribe(topics, messageErrors)

// 	var c = BusClient{
// 		Client:           client,
// 		SubscribeChannel: topics[0],
// 		PulishTopic:      config.Binding.PublishTopic,
// 		MessageErrors:    messageErrors,
// 	}

// 	Client = &c
// 	return nil
// }

// func GetBusClient() *BusClient {
// 	return Client
// }

// func (client *BusClient) request(content Content, timeout int) (Content, error) {
// 	payload, err := json.Marshal(&content)
// 	if err != nil {
// 		return Content{}, err
// 	}

// 	correlationID := uuid.New().String()
// 	msgEnvelope := types.MessageEnvelope{
// 		CorrelationID: correlationID,
// 		Payload:       payload,
// 		ContentType:   ContentTypeJSON,
// 	}
// 	log.Printf("Publish:%+v", content)
// 	err = client.Client.Publish(msgEnvelope, client.PulishTopic)
// 	if err != nil {
// 		return Content{}, err
// 	}

// 	ok := false
// 	for !ok {
// 		select {
// 		case <-time.After(time.Duration(timeout) * time.Second):
// 			return Content{}, fmt.Errorf("Wait response timeout")
// 		case msgErr := <-client.MessageErrors:
// 			return Content{}, msgErr
// 		case msgEnvelope = <-client.SubscribeChannel.Messages:
// 			if msgEnvelope.CorrelationID == correlationID {
// 				ok = true
// 			}
// 		}
// 	}

// 	var repContent Content
// 	err = json.Unmarshal(msgEnvelope.Payload, &repContent)
// 	return repContent, err
// }

// func ProxyHandler(w http.ResponseWriter, r *http.Request) {
// 	defer r.Body.Close()
// 	vars := mux.Vars(r)
// 	service := vars["service"]
// 	path := vars["path"]
// 	path = strings.ReplaceAll(path, ":", "/")
// 	method := r.Method

// 	body, err := ioutil.ReadAll(r.Body)
// 	if err != nil {
// 		// log.Printf("Error reading body: %v", err)
// 		http.Error(w, "can't read body", http.StatusBadRequest)
// 		return
// 	}

// 	requestContent := Content{
// 		Service: service,
// 		Method:  method,
// 		Path:    path,
// 		Body:    string(body),
// 	}
// 	content, err := Client.request(requestContent, 30)
// 	log.Printf("Recevier:%+v", content)
// 	if err != nil {
// 		// log.Printf("Error send request: %v", err)
// 		http.Error(w, fmt.Sprintf("Error send request: %v", err), http.StatusInternalServerError)
// 		return
// 	}

// 	if content.Error != "" {
// 		// log.Printf("Error send request: %v", content.Error)
// 		http.Error(w, fmt.Sprintf("Error send request: %v", content.Error), http.StatusInternalServerError)
// 		return
// 	}
// 	w.Write([]byte(content.Body))
// }

type BusClient struct {
	client      messaging.MessageClient
	pulishTopic string
	topics      []types.TopicChannel
	bus         *pubsub.Publisher
	timeout     int64
}

var busclient *BusClient

// Initialize ...
func Initialize(config *configs.Config) error {
	log.Printf(fmt.Sprintf("Initializing Message Bus Trigger for '%s'", config.MessageBus.Type))

	client, err := messaging.NewMessageClient(config.MessageBus)
	if err != nil {
		return err
	}

	topics := []types.TopicChannel{{Topic: config.Binding.SubscribeTopic, Messages: make(chan types.MessageEnvelope)}}
	messageErrors := make(chan error)
	err = client.Connect()
	if err != nil {
		return err
	}

	client.Subscribe(topics, messageErrors)
	receiveMessage := true
	timeout := config.Server.TimePubSub
	p := pubsub.NewPublisher(time.Duration(timeout)*time.Second, ChanSizeDefault)

	var c = BusClient{
		client:      client,
		pulishTopic: config.Binding.PublishTopic,
		topics:      topics,
		bus:         p,
		timeout:     timeout,
	}

	busclient = &c

	deferred := func() {
		log.Printf("Disconnecting from the message bus")
		busclient.bus.Close()
		err := busclient.client.Disconnect()
		if err != nil {
			log.Printf("Unable to disconnect from the message bus", "error", err.Error())
		}
	}

	go func() {
		defer deferred()

		for receiveMessage {
			select {
			case msgErr := <-messageErrors:
				log.Printf(fmt.Sprintf("Failed to receive message from bus, %v", msgErr))

			case msgs := <-busclient.topics[0].Messages:
				go func() {
					log.Println("Received message from bus", "topic", config.Binding.SubscribeTopic, msgs.CorrelationID)
					busclient.bus.Publish(msgs)
				}()
			}
		}
	}()

	return nil
}

func filter(correlationID string) func(v interface{}) bool {
	return func(v interface{}) bool {
		msg := v.(types.MessageEnvelope)
		if msg.CorrelationID == correlationID {
			return true
		}
		return false
	}
}

func (c *BusClient) request(content Content, timeout int) (Content, error) {
	payload, err := json.Marshal(&content)
	if err != nil {
		return Content{}, err
	}

	correlationID := uuid.New().String()
	msgEnvelope := types.MessageEnvelope{
		CorrelationID: correlationID,
		Payload:       payload,
		ContentType:   ContentTypeJSON,
	}

	reper := c.bus.SubscribeTopic(filter(correlationID))
	defer c.bus.Evict(reper)

	log.Printf("Publish:%+v", content)
	err = c.client.Publish(msgEnvelope, c.pulishTopic)
	if err != nil {
		return Content{}, err
	}

	var repEnvelope interface{}
	select {
	case <-time.After(time.Duration(timeout) * time.Second):
		return Content{}, fmt.Errorf("Wait response timeout")
	case repEnvelope = <-reper:
	}

	var repContent Content
	err = json.Unmarshal(repEnvelope.(types.MessageEnvelope).Payload, &repContent)
	return repContent, err
}

func ProxyHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	vars := mux.Vars(r)
	service := vars["service"]
	path := vars["path"]
	path = strings.ReplaceAll(path, ":", "/")
	method := r.Method

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "can't read body", http.StatusBadRequest)
		return
	}

	requestContent := Content{
		Service: service,
		Method:  method,
		Path:    path,
		Body:    string(body),
	}
	content, err := busclient.request(requestContent, 30)
	log.Printf("Recevier:%+v", content)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error send request: %v", err), http.StatusInternalServerError)
		return
	}

	if content.Error != "" {
		http.Error(w, fmt.Sprintf("Error send request: %v", content.Error), http.StatusInternalServerError)
		return
	}
	w.Write([]byte(content.Body))
}
