package controller

import (
	"net/http"

	"gopkg.in/yaml.v3"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func getViewParamResponse(viewDef *yaml.Node, loader meta.BundleLoader) *meta.BotParamsResponse {
	response := meta.BotParamsResponse{}

	params, err := meta.GetMapNode(viewDef, "params")
	if err != nil {
		return &response
	}

	if params == nil || params.Kind != yaml.MappingNode {
		return &response
	}

	paramPairs, err := meta.GetMapNodes(params)
	if err != nil {
		return &response
	}

	for _, param := range paramPairs {
		response = append(response, meta.BotParamResponse{
			Name:       param.Key,
			Label:      meta.GetNodeValueAsString(param.Node, "label"),
			Type:       meta.GetNodeValueAsString(param.Node, "type"),
			Default:    meta.GetNodeValueAsString(param.Node, "default"),
			Collection: meta.GetNodeValueAsString(param.Node, "collection"),
			Required:   meta.GetNodeValueAsBool(param.Node, "required", false),
			SelectList: meta.GetNodeValueAsString(param.Node, "selectList"),
		})
	}

	return &response
}

func getParamsForView(viewNamespace, viewName string, loader meta.BundleLoader) (*meta.BotParamsResponse, error) {
	view := meta.NewBaseView(viewNamespace, viewName)
	if err := loader(view); err != nil {
		return nil, err
	} else {
		return getViewParamResponse((*yaml.Node)(view.Definition), loader), nil
	}
}

func GetViewParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	session := middleware.GetSession(r)
	loader := func(item meta.BundleableItem) error {
		return bundle.Load(item, nil, session, nil)
	}
	viewParams, err := getParamsForView(namespace, name, loader)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	filejson.RespondJSON(w, r, viewParams)
}
