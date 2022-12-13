package routing

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getHomeRoute(session *sess.Session) (*meta.Route, error) {
	homeRoute := session.GetSite().GetAppBundle().HomeRoute
	namespace, name, err := meta.ParseKey(homeRoute)
	if err != nil {
		return nil, err
	}
	route := &meta.Route{
		Name:      name,
		Namespace: namespace,
	}
	err = bundle.Load(route, nil, session) //TO-DO
	if err != nil {
		return nil, err
	}

	return route, nil
}

func GetRouteFromPath(r *http.Request, namespace, path, prefix string, session *sess.Session) (*meta.Route, error) {
	route := &meta.Route{}
	var routes meta.RouteCollection

	if path == "" {
		return getHomeRoute(session)
	}

	err := bundle.LoadAll(&routes, namespace, nil, session)
	if err != nil {
		return nil, err
	}

	router := mux.NewRouter()

	for _, item := range routes {
		router.Path(prefix + item.Path)
	}

	routematch := &mux.RouteMatch{}

	matched := router.Match(r, routematch)

	if !matched {
		return nil, errors.New("No Route Match Found: " + path)
	}

	pathTemplate, err := routematch.Route.GetPathTemplate()
	if err != nil {
		return nil, errors.New("No Path Template For Route Found")
	}

	pathTemplate = strings.Replace(pathTemplate, prefix, "", 1)

	for _, item := range routes {
		if item.Path == pathTemplate {
			meta.Copy(route, item)
			break
		}
	}

	if route == nil {
		return nil, errors.New("No Route Found in Cache")
	}

	// Process merge syntax for default route params
	mergeFuncs := datasource.GetMergeFuncs(session, nil)

	for paramName, paramValue := range route.Params {
		template, err := templating.NewWithFuncs(paramValue, templating.ForceErrorFunc, mergeFuncs)
		if err != nil {
			return nil, err
		}

		mergedValue, err := templating.Execute(template, nil)
		if err != nil {
			return nil, err
		}

		route.Params[paramName] = mergedValue
	}

	if route.Params == nil {
		route.Params = map[string]string{}
	}

	// Now add in querystring parameters
	for k, v := range r.URL.Query() {
		route.Params[k] = v[0]
	}

	// Add the routematch params
	for k, v := range routematch.Vars {
		route.Params[k] = v
	}

	route.Path = path

	return datasource.RunRouteBots(route, session)
}

func GetRouteFromCollection(r *http.Request, namespace, collection string, viewtype string, recordID string, session *sess.Session) (*meta.Route, error) {

	var route *meta.Route
	var routes meta.RouteCollection
	err := bundle.LoadAllFromAny(&routes, nil, session)
	if err != nil {
		return nil, err
	}

	for _, item := range routes {
		if item.Collection == namespace+"."+collection && item.ViewType == viewtype {
			route = item
			break
		}
	}

	if route == nil {
		return nil, errors.New("No route found with this collection and view type: " + namespace + "." + collection + " : " + viewtype)
	}

	if viewtype == "detail" {
		muxRoute, err := mux.NewRouter().Path("/"+route.Path).URL("recordid", recordID)
		if err != nil {
			return nil, err
		}
		route.Path = muxRoute.Path[1:]
		route.Params = map[string]string{
			"recordid": recordID,
		}
	}

	if viewtype == "list" {
		route.Params = map[string]string{}
	}

	return datasource.RunRouteBots(route, session)
}
