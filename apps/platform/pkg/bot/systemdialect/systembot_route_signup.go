package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runSignupRouteBot(route *meta.Route, session *sess.Session) (*meta.Route, error) {
	signupRouteKey := session.GetSignupRoute()
	if signupRouteKey == "" {
		return route, nil
	}
	signupRoute, err := meta.NewRoute(signupRouteKey)
	if err != nil {
		return nil, err
	}
	err = bundle.Load(signupRoute, session, nil)
	if err != nil {
		return nil, err
	}
	return signupRoute, nil
}
