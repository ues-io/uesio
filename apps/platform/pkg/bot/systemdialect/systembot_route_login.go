package systemdialect

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runLoginRouteBot(route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error) {
	loginRouteKey := session.GetLoginRoute()
	if loginRouteKey == "" {
		return route, nil
	}
	loginRoute, err := meta.NewRoute(loginRouteKey)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(loginRoute, session, nil)
	if err != nil {
		return nil, err
	}
	return loginRoute, nil
}
