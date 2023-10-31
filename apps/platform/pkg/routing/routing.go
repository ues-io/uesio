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
	route := meta.NewBaseRoute("", "")
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

	routeMatch := &mux.RouteMatch{}

	if matched := router.Match(r, routeMatch); !matched {
		return nil, errors.New("No Route Match Found: " + path)
	}

	pathTemplate, err := routeMatch.Route.GetPathTemplate()
	if err != nil {
		return nil, errors.New("no Path Template found for route")
	}

	pathTemplate = strings.Replace(pathTemplate, prefix, "", 1)

	for _, item := range routes {
		if item.Path == pathTemplate {
			// Clone the route to ensure we don't mutate in-memory metadata
			meta.Copy(route, item)
			break
		}
	}
	if route != nil {
		route.Path = path
		if route.Params == nil {
			route.Params = map[string]string{}
		}
		// Inject all routeMatch vars, which are fully-resolved and can safely override anything in route params
		if len(routeMatch.Vars) > 0 {
			for k, v := range routeMatch.Vars {
				route.Params[k] = v
			}
		}
	}

	return route, nil
}

func GetRouteFromAssignment(r *http.Request, namespace, collection string, viewtype string, recordID string, session *sess.Session) (*meta.Route, error) {

	var routeAssignment *meta.RouteAssignment
	var routeAssignments meta.RouteAssignmentCollection

	err := bundle.LoadAllFromAny(&routeAssignments, map[string]string{"uesio/studio.collection": namespace + "." + collection}, session, nil)
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
