package routing

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func GetHomeRoute(session *sess.Session) (*meta.Route, error) {
	homeRoute := session.GetSite().GetAppBundle().HomeRoute

	route, err := meta.NewRoute(homeRoute)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(route, session, nil)
	if err != nil {
		return nil, err
	}

	return route, nil
}

func GetRouteFromPath(r *http.Request, namespace, path, prefix string, session *sess.Session) (*meta.Route, error) {
	route := &meta.Route{}
	var routes meta.RouteCollection

	if path == "" {
		return GetHomeRoute(session)
	}

	err := bundle.LoadAll(&routes, namespace, nil, session, nil)
	if err != nil {
		return nil, err
	}

	router := mux.NewRouter()

	for _, item := range routes {
		router.Path(prefix + item.Path)
	}

	routematch := &mux.RouteMatch{}

	if matched := router.Match(r, routematch); !matched {
		return nil, errors.New("No Route Match Found: " + path)
	}

	pathTemplate, err := routematch.Route.GetPathTemplate()
	if err != nil {
		return nil, errors.New("no Path Template found for route")
	}

	pathTemplate = strings.Replace(pathTemplate, prefix, "", 1)

	for _, item := range routes {
		if item.Path == pathTemplate {
			meta.Copy(route, item)
			break
		}
	}

	processedParams := map[string]string{}

	for paramName, paramValue := range route.Params {
		template, err := templating.NewWithFuncs(paramValue, templating.ForceErrorFunc, merge.ServerMergeFuncs)
		if err != nil {
			return nil, err
		}

		mergedValue, err := templating.Execute(template, merge.ServerMergeData{
			Session:     session,
			ParamValues: nil,
		})
		if err != nil {
			return nil, err
		}

		processedParams[paramName] = mergedValue
	}

	// Now add in querystring parameters
	for k, v := range r.URL.Query() {
		processedParams[k] = v[0]
	}

	// Add the routematch params
	for k, v := range routematch.Vars {
		processedParams[k] = v
	}

	route.Path = path
	route.Params = processedParams

	return datasource.RunRouteBots(route, session)
}

func GetRouteFromAssignment(r *http.Request, namespace, collection string, viewtype string, recordID string, session *sess.Session) (*meta.Route, error) {

	var routeassignment *meta.RouteAssignment
	var routeassignments meta.RouteAssignmentCollection

	err := bundle.LoadAllFromAny(&routeassignments, map[string]string{"uesio/studio.collection": namespace + "." + collection}, session, nil)
	if err != nil {
		return nil, err
	}

	for _, item := range routeassignments {
		if item.Type == viewtype {
			routeassignment = item
			break
		}
	}

	if routeassignment == nil {
		return nil, errors.New("No route found with this collection and view type: " + namespace + "." + collection + " : " + viewtype)
	}

	route, err := meta.NewRoute(routeassignment.RouteRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(route, session, nil)
	if err != nil {
		return nil, err
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
