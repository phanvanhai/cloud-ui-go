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

package core

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"

	"github.com/phanvanhai/cloud-ui-go/internal/configs"
)

const (
	HttpProtocol           = "http"
	OriginHostReqHeader    = "X-Origin-Host"
	ForwardedHostReqHeader = "X-Forwarded-Host"
)

func ProxyHandler(w http.ResponseWriter, r *http.Request, path string, prefix string) {
	defer r.Body.Close()

	targetAddr := ""
	newPath := ""
	if configs.GetConfig().Binding.Type == "messagebus" {
		port := configs.GetConfig().Server.Port
		portStr := strconv.FormatInt(port, 10)
		// targetIP := configs.GetConfig().Server.Host
		targetIP := "localhost"
		targetAddr = HttpProtocol + "://" + targetIP + ":" + portStr

		service := configs.PrefixServiceMap[prefix]
		path = strings.ReplaceAll(path, "/", ":")
		newPath = fmt.Sprintf("/request/%s/%s", service, path)
	} else {
		targetAddr = configs.ProxyMapping[prefix]
		newPath = path
	}

	origin, _ := url.Parse(targetAddr)
	director := func(req *http.Request) {
		req.Header.Add(ForwardedHostReqHeader, req.Host)
		req.Header.Add(OriginHostReqHeader, origin.Host)
		req.URL.Scheme = HttpProtocol
		req.URL.Host = origin.Host
		req.URL.Path = newPath
	}

	proxy := &httputil.ReverseProxy{Director: director}
	proxy.ServeHTTP(w, r)
}
