package systemdialect

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runRetrieveRouteBot(route *meta.Route, request *http.Request, connection wire.Connection, uesioSession *sess.Session) (*meta.Route, error) {

	anonSession := sess.GetStudioAnonSession(uesioSession.Context())

	// appParam, ok := route.Params["app"]
	// if !ok {
	// 	return nil, errors.New("system bot: missing required parameter app ")
	// }

	// versionParam, ok := route.Params["version"]
	// if !ok {
	// 	return nil, errors.New("system bot: missing required parameter version ")
	// }

	// appID := goutils.StringValue(appParam)
	// version := goutils.StringValue(versionParam)

	// major, minor, patch, err := meta.ParseVersionStringToInt(version)
	// if err != nil {
	// 	return nil, err
	// }

	// var bundle meta.Bundle
	// err = datasource.PlatformLoadOne(
	// 	&bundle,
	// 	&datasource.PlatformLoadOptions{
	// 		Connection: connection,
	// 		Fields: []wire.LoadRequestField{
	// 			{
	// 				ID: "uesio/studio.major",
	// 			},
	// 			{
	// 				ID: "uesio/studio.minor",
	// 			},
	// 			{
	// 				ID: "uesio/studio.patch",
	// 			},
	// 			{
	// 				ID: "uesio/studio.app",
	// 				Fields: []wire.LoadRequestField{
	// 					{
	// 						ID: commonfields.UniqueKey,
	// 					},
	// 				},
	// 			},
	// 		},
	// 		Conditions: []wire.LoadRequestCondition{
	// 			{
	// 				Field: "uesio/studio.major",
	// 				Value: major,
	// 			},
	// 			{
	// 				Field: "uesio/studio.minor",
	// 				Value: minor,
	// 			},
	// 			{
	// 				Field: "uesio/studio.patch",
	// 				Value: patch,
	// 			},
	// 			{
	// 				Field: "uesio/studio.app->" + commonfields.UniqueKey,
	// 				Value: appID,
	// 			},
	// 		},
	// 	},
	// 	anonSession,
	// )

	uesioSession = anonSession

	paymentRoute := &meta.Route{
		// BundleableBase: meta.BundleableBase{
		// 	Namespace: "uesio/studio",
		// 	Name:      "userpayments",
		// },
		// ViewRef: "uesio/studio.userpayments",

		Redirect: "/version/uesio/crm/v1.1.60/metadata/retrieve",
		ThemeRef: "uesio/studio.default",
		Params:   nil,
		Type:     "redirect",
	}

	return paymentRoute, nil
}
