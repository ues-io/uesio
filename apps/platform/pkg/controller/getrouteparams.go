package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func getParamsForRouteBot(routeBotKey string, loader meta.BundleLoader) (*meta.BotParamsResponse, error) {
	ns, name, err := meta.ParseKey(routeBotKey)
	if err != nil {
		return nil, err
	}
	routeBot := meta.NewRouteBot(ns, name)
	if err = loader(routeBot); err != nil {
		return nil, err
	}
	response := meta.BotParamsResponse{}
	for _, param := range routeBot.Params {
		response = append(response, meta.BotParamResponse{
			Name:       param.Name,
			Type:       param.Type,
			Default:    param.Default,
			SelectList: param.SelectList,
		})
	}
	return &response, nil
}

func getRouteParamsResponse(route *meta.Route, loader meta.BundleLoader) (*meta.BotParamsResponse, error) {
	switch route.Type {
	case "redirect":
		// If this is a "redirect" route, then there are no parameters to return
		return &meta.BotParamsResponse{}, nil
	case "bot":
		// Fetch parameters for the corresponding Route Bot and build a response for each
		if route.BotRef != "" {
			return getParamsForRouteBot(route.BotRef, loader)
		} else {
			return nil, exceptions.NewNotFoundException("the requested route has no associated Bot to run, so no parameters could be returned")
		}
	default:
		// If this is a View Route, then we need to fetch the Parameters for the Route's corresponding View
		if route.ViewRef != "" {
			viewNamespace, viewName, err := meta.ParseKey(route.ViewRef)
			if err != nil {
				return nil, err
			}
			return getParamsForView(viewNamespace, viewName, loader)
		} else {
			return nil, exceptions.NewNotFoundException("the requested route has no associated view, so no parameters could be returned")
		}
	}
}

func GetRouteParams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	session := middleware.GetSession(r)
	loader := func(item meta.BundleableItem) error {
		return bundle.Load(item, session, nil)
	}
	route := meta.NewBaseRoute(namespace, name)
	if err := loader(route); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	routeParams, err := getRouteParamsResponse(route, loader)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	file.RespondJSON(w, r, routeParams)
}
