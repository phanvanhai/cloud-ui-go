/*******************************************************************************
 * Copyright © 2017-2018 VMware, Inc. All Rights Reserved.
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
 *******************************************************************************/

package main

import (
	"flag"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/phanvanhai/cloud-ui-go/internal"
	"github.com/phanvanhai/cloud-ui-go/internal/configs"
	"github.com/phanvanhai/cloud-ui-go/internal/core"
	"github.com/phanvanhai/cloud-ui-go/internal/messagebus"
	"github.com/phanvanhai/cloud-ui-go/internal/pkg/usage"
)

func main() {

	var confFilePath string

	flag.StringVar(&confFilePath, "conf", "", "Specify local configuration file path")

	flag.Usage = usage.HelpCallback
	flag.Parse()

	err := configs.LoadConfig(confFilePath)
	if err != nil {
		log.Printf("ERROR: Load config failed. Error:%v\n", err)
		return
	}

	r := internal.InitRestRoutes()
	if configs.GetConfig().Binding.Type == "messagebus" {
		err = messagebus.Initialize(configs.GetConfig())
		if err != nil {
			log.Printf("ERROR: Connect MessageBus failed. Error:%v\n", err)
		}
	}

	server := &http.Server{
		Handler:      core.GeneralFilter(r),
		Addr:         ":" + strconv.FormatInt(configs.GetConfig().Server.Port, 10),
		WriteTimeout: 45 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Println("UI Server Listen On " + server.Addr)

	log.Fatal(server.ListenAndServe())
}
