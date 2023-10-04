package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runLoginRouteBot(route *meta.Route, session *sess.Session) error {
	loginRouteKey := session.GetLoginRoute()
	if loginRouteKey == "" {
		return nil
	}
	loginRoute, err := meta.NewRoute(loginRouteKey)
	if err != nil {
		return err
	}
	err = bundle.Load(loginRoute, session, nil)
	if err != nil {
		return err
	}
	*route = *loginRoute
	return nil
}
