/*******************************************************************************
 * Copyright © 2018-2019 VMware, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 *******************************************************************************/

package configs

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	"github.com/BurntSushi/toml"
	"github.com/edgexfoundry/go-mod-messaging/pkg/types"
)

const (
	defaultConfigFilePath = "res/configuration.toml"
)

var (
	PrefixServiceMap map[string]string
	ProxyMapping     map[string]string
	CurrentConfig    *Config
)

// BindingInfo contains Metadata associated with each binding
type BindingInfo struct {
	Type           string
	SubscribeTopic string
	PublishTopic   string
}

type Config struct {
	Server  Service               `toml:"Service"`
	Clients map[string]ClientInfo `toml:"Clients"`
	// MessageBus
	MessageBus types.MessageBusConfig
	// Binding
	Binding BindingInfo
}

type Service struct {
	Host                string
	Port                int64
	Labels              []string
	OpenMsg             string
	StaticResourcesPath string
	TimePubSub          int64
}

type ClientInfo struct {
	// Host is the hostname or IP address of a service.
	Host string
	// Port defines the port on which to access a given service
	Port int
	// Protocol indicates the protocol to use when accessing a given service
	Protocol string
	// Proxy path prefix
	PathPrefix string
}

func LoadConfig(confFilePath string) error {
	if len(confFilePath) == 0 {
		confFilePath = defaultConfigFilePath
	}

	absPath, err := filepath.Abs(confFilePath)
	if err != nil {
		log.Printf("Could not create absolute path to load configuration: %s; %v", absPath, err.Error())
		return err
	}
	log.Printf("Loading configuration from: %s\n", absPath)
	var conf Config
	if _, err := toml.DecodeFile(absPath, &conf); err != nil {
		log.Printf("Decode Config File Error:%v", err)
		return err
	}
	CurrentConfig = &conf
	initProxyMapping()
	return nil
}

func initProxyMapping() {

	ProxyMapping = make(map[string]string)
	PrefixServiceMap = make(map[string]string)

	for service, client := range CurrentConfig.Clients {
		ProxyMapping[client.PathPrefix] = fmt.Sprintf("%s://%s:%d", client.Protocol, client.Host, client.Port)
		PrefixServiceMap[client.PathPrefix] = service
	}
}

func GetConfig() *Config {
	return CurrentConfig
}

func GetConfigHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	encode(CurrentConfig, w)
}

func encode(data interface{}, writer http.ResponseWriter) {
	writer.Header().Add("Content-Type", "application/json")

	enc := json.NewEncoder(writer)
	err := enc.Encode(data)
	// Problems encoding
	if err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
		return
	}
}
