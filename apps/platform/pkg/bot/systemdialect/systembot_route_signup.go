package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runSignupRouteBot(route *meta.Route, session *sess.Session) error {
	signupRouteKey := session.GetSignupRoute()
	if signupRouteKey == "" {
		return nil
	}
	signupRoute, err := meta.NewRoute(signupRouteKey)
	if err != nil {
		return err
	}
	err = bundle.Load(signupRoute, session, nil)
	if err != nil {
		return err
	}
	*route = *signupRoute
	return nil
}
