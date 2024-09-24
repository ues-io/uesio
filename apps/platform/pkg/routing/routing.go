package routing

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetHomeRoute(session *sess.Session) (*meta.Route, error) {
	homeRoute := session.GetSite().GetAppBundle().HomeRoute

	if homeRoute == "" {
		return nil, exceptions.NewNotFoundException("It appears that the developer of this site has not specified a home page.")
	}

	route, err := meta.NewRoute(homeRoute)
	if err != nil {
		return nil, exceptions.NewNotFoundException(err.Error())
	}
	err = bundle.Load(route, nil, session, nil)
	if err != nil {
		return nil, err
	}

	return route, nil
}

func GetRouteFromPath(r *http.Request, namespace, path, prefix string, session *sess.Session, connection wire.Connection) (*meta.Route, error) {

	var routes meta.RouteCollection

	if path == "" {
		return GetHomeRoute(session)
	}

	// TODO: Figure out why connection has to be nil
	err := bundle.LoadAll(&routes, namespace, nil, session, nil)
	if err != nil {
		return nil, err
	}

	router := mux.NewRouter()

	for _, item := range routes {
		router.Path(prefix + item.Path)
	}

	routeMatch := &mux.RouteMatch{}

	if matched := router.Match(r, routeMatch); !matched {
		return nil, errors.New("No Route Match Found: " + path)
	}

	pathTemplate, err := routeMatch.Route.GetPathTemplate()
	if err != nil {
		return nil, errors.New("no Path Template found for route")
	}

	pathTemplate = strings.Replace(pathTemplate, prefix, "", 1)

	var route *meta.Route
	for _, item := range routes {
		if item.Path == pathTemplate {
			// Clone the route to ensure we don't mutate in-memory metadata
			route = item.Copy()
			break
		}
	}
	if route == nil {
		return nil, errors.New("Error matching route")
	}
	route.Path = path
	// Inject all routeMatch vars, which are fully-resolved and can safely override anything in route params
	if len(routeMatch.Vars) > 0 {
		for k, v := range routeMatch.Vars {
			route.Params[k] = v
		}
	}

	params, err := ResolveRouteParams(route.Params, session, r.URL.Query())
	if err != nil {
		return nil, errors.New("unable to resolve route parameters: " + err.Error())
	}
	route.Params = params

	return datasource.RunRouteBots(route, r, session, connection)
}

func GetRouteFromAssignment(r *http.Request, namespace, collection string, viewtype string, recordID string, session *sess.Session, connection wire.Connection) (*meta.Route, error) {

	var routeAssignment *meta.RouteAssignment
	var routeAssignments meta.RouteAssignmentCollection

	err := bundle.LoadAllFromAny(&routeAssignments, &bundlestore.GetAllItemsOptions{
		Conditions: map[string]interface{}{"uesio/studio.collection": namespace + "." + collection},
	}, session, nil)
	if err != nil {
		return nil, err
	}

	for _, item := range routeAssignments {
		if item.Type == viewtype {
			routeAssignment = item
			break
		}
	}

	if routeAssignment == nil {
		return nil, errors.New("No route found with this collection and view type: " + namespace + "." + collection + " : " + viewtype)
	}

	route, err := meta.NewRoute(routeAssignment.RouteRef)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(route, nil, session, nil)
	if err != nil {
		return nil, err
	}

	if viewtype == "detail" {
		muxRoute, err := mux.NewRouter().Path("/"+route.Path).URL("recordid", recordID)
		if err != nil {
			return nil, err
		}
		route.Path = muxRoute.Path[1:]
		route.Params = map[string]interface{}{
			"recordid": recordID,
		}
	}

	if viewtype == "list" {
		route.Params = map[string]interface{}{}
	}

	// TODO: Allow use of other parameters, e.g. query string parameters, route parameters

	return datasource.RunRouteBots(route, r, session, connection)
}

func GetRouteByKey(r *http.Request, namespace, routeName string, session *sess.Session, connection wire.Connection) (*meta.Route, error) {
	route := meta.NewBaseRoute(namespace, routeName)
	// TODO: connection should not have to be nil
	err := bundle.Load(route, nil, session, nil)
	if err != nil || route == nil {
		return nil, exceptions.NewNotFoundException("route not found: " + fmt.Sprintf("%s.%s", namespace, routeName))
	}
	if route.Params == nil {
		route.Params = map[string]interface{}{}
	}
	params, err := ResolveRouteParams(route.Params, session, r.URL.Query())
	if err != nil {
		return nil, exceptions.NewBadRequestException("unable to resolve route parameters: " + err.Error())
	}
	route.Params = params
	route, err = datasource.RunRouteBots(route, r, session, connection)
	if err != nil {
		return nil, err
	}
	// If the route path contains merges, we need to evaluate the merge now
	route.Path = mergeRoutePath(route.Path, params)
	return route, nil
}

func mergeRoutePath(path string, params map[string]interface{}) string {
	if len(path) == 0 || len(params) == 0 {
		return path
	}
	for paramName, paramValue := range params {
		mergeStr := fmt.Sprintf("{%s}", paramName)
		path = strings.ReplaceAll(path, mergeStr, fmt.Sprintf("%v", paramValue))
	}
	return path
}

func ResolveRouteParams(routeParams map[string]interface{}, s *sess.Session, vars url.Values) (map[string]interface{}, error) {
	processedParams := map[string]interface{}{}

	for paramName, paramValue := range routeParams {
		// For now, only merge string parameters. Consider merging []string as well...
		switch typedParamValue := paramValue.(type) {
		case string:
			template, err := templating.NewWithFuncs(typedParamValue, templating.ForceErrorFunc, merge.ServerMergeFuncs)
			if err != nil {
				return nil, err
			}

			mergedValue, err := templating.Execute(template, merge.ServerMergeData{
				Session:     s,
				ParamValues: nil,
			})
			if err != nil {
				return nil, err
			}
			processedParams[paramName] = mergedValue
		default:
			processedParams[paramName] = paramValue
		}
	}

	// Inject query-string parameters
	for k, v := range vars {
		processedParams[k] = v[0]
	}

	return processedParams, nil
}
