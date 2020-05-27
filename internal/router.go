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
 *
 * @author: Huaqiao Zhang, <huaqiaoz@vmware.com>
 *******************************************************************************/

package internal

import (
	"net/http"

	"github.com/phanvanhai/cloud-ui-go/internal/configs"

	mux "github.com/gorilla/mux"
	"github.com/phanvanhai/cloud-ui-go/internal/handler"
	"github.com/phanvanhai/cloud-ui-go/internal/messagebus"
)

func InitRestRoutes() http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/request/{service}/{path}", messagebus.ProxyHandler)
	r.HandleFunc("/getconfig", configs.GetConfigHandler).Methods(http.MethodGet)
	// r.HandleFunc("/setconfig", PostConfigHandler).Methods(http.MethodPost)
	s := r.PathPrefix("/api/v1").Subrouter()
	s.HandleFunc("/profile/download", handler.DowloadProfile).Methods(http.MethodGet)

	return r
}

// func PostConfigHandler(w http.ResponseWriter, r *http.Request) {
// 	defer r.Body.Close()

// 	body, err := ioutil.ReadAll(r.Body)
// 	if err != nil {
// 		fmt.Println("can't read body")
// 		http.Error(w, "can't read body", http.StatusBadRequest)
// 		return
// 	}

// 	var config configs.Config
// 	err = json.Unmarshal(body, &config)
// 	if err != nil {
// 		fmt.Println(err.Error())
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}

// 	config.MessageBus.Type = "mqtt"

// 	cf := configs.GetConfig()
// 	cf.Binding = config.Binding
// 	cf.MessageBus = config.MessageBus

// 	err = messagebus.Initialize(cf)
// 	if err != nil {
// 		fmt.Println(err.Error())
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}

// 	w.Write([]byte("Update success"))
// }
