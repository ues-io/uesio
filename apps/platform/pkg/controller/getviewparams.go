package controller

import (
	"net/http"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func getViewParamResponse(viewDef *yaml.Node) meta.BotParamsResponse {
	response := meta.BotParamsResponse{}

	params, err := meta.GetMapNode(viewDef, "params")
	if err != nil {
		return response
	}

	if params == nil || params.Kind != yaml.MappingNode {
		return response
	}

	paramPairs, err := meta.GetMapNodes(params)
	if err != nil {
		return response
	}

	for _, param := range paramPairs {
		response = append(response, meta.BotParamResponse{
			Name:       param.Key,
			Type:       meta.GetNodeValueAsString(param.Node, "type"),
			Default:    meta.GetNodeValueAsString(param.Node, "default"),
			Collection: meta.GetNodeValueAsString(param.Node, "collection"),
		})
	}

	return response
}

func GetViewParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	session := middleware.GetSession(r)
	view := meta.NewBaseView(namespace, name)

	if err := bundle.Load(view, session, nil); err != nil {
		HandleError(w, err)
		return
	} else {
		file.RespondJSON(w, r, getViewParamResponse((*yaml.Node)(view.Definition)))
	}
}
