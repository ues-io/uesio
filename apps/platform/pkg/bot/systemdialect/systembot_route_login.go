package systemdialect

import (
	"context"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runLoginRouteBot(ctx context.Context, route *meta.Route, request *http.Request, connection wire.Connection, session *sess.Session) (*meta.Route, error) {
	return routing.GetLoginRoute(ctx, session)
}
