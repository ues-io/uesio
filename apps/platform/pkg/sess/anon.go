package sess

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

func GetAnonSession(ctx context.Context, site *meta.Site) *Session {
	s := New("", &meta.User{
		Username:    "boot",
		FirstName:   "Boot",
		LastName:    "User",
		Permissions: meta.GetAdminPermissionSet(),
	}, site)
	s.SetGoContext(ctx)
	return s
}

func GetAnonSessionFrom(session *Session) *Session {
	return GetAnonSession(session.Context(), session.GetSite())
}

func GetStudioAnonSession(ctx context.Context) *Session {
	return GetAnonSession(ctx, GetStudioSite())
}

func GetStudioSite() *meta.Site {
	app := &meta.App{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/studio",
		},
	}
	site := &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/studio:prod",
		},
		Name: "prod",
		Bundle: &meta.Bundle{
			App:   app,
			Major: 0,
			Minor: 0,
			Patch: 1,
		},
		App: app,
	}
	site.SetAppBundle(&meta.BundleDef{
		Name: "uesio/studio",
		Dependencies: meta.BundleDefDependencyMap{
			"uesio/core": {
				Version: "v0.0.1",
			},
			"uesio/builder": {
				Version: "v0.0.1",
			},
			"uesio/io": {
				Version: "v0.0.1",
			},
		},
		Licenses: map[string]*meta.License{
			"uesio/core": {
				Active: true,
			},
			"uesio/io": {
				Active: true,
			},
			"uesio/builder": {
				Active: true,
			},
		},
	})
	return site
}
