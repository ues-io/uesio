package controller

import (
	"context"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/routing"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func Logout(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	route, err := routing.GetLoginRoute(session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	redirectPath, err := NewLoginResponseFromRoute(preload.GetUserMergeData(session), session, route)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	filejson.RespondJSON(w, r, redirectPath)
}

// Logs out any current user and logs in as the public user
//
// All auth related activities should occur as a public user. Since any route can be an auth related route, we cannot
// reliably redirect away from the route if the user is currently logged in due to the way routing works. Instead,
// we ensure that we always process auth related activities as a public user by logging out any current user (which
// may or may not be the public user) and logging in as the public user before continuing.
func ensurePublicSession(ctx context.Context) (*sess.Session, error) {
	session := middleware.GetSessionFromContext(ctx)
	site := session.GetSite()

	session, err := middleware.ProcessLogout(ctx, site)
	if err != nil {
		return nil, err
	}
	// TODO: Think through whether or not we should be calling the equivalent of auth.setSession
	// to modify the session information for the entire request. In theory, once we make it through
	// middleware and controllers, we should only be passing around a context.Context & sess.Session and
	// not the actualhttp request & responsewriter however we have several packages (auth, sess, middleware,
	// controller, etc.) that are all, at some level, "controller" methods given current implementation. Once
	// things are refactored, context passed throughout the system independently and sess.Sess where applicable,
	// this can likely go completely away anyway.
	return session, nil
}
