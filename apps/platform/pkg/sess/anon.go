package sess

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func GetAnonSession(site *meta.Site) *Session {
	s := New(&meta.User{
		BuiltIn: meta.BuiltIn{
			UniqueKey: meta.BootUsername,
		},
		Username:    meta.BootUsername,
		FirstName:   "Boot",
		LastName:    "User",
		Permissions: meta.GetAdminPermissionSet(),
	}, site)
	return s
}

func GetAnonSessionFrom(session *Session) *Session {
	return GetAnonSession(session.GetSite())
}

func GetStudioAnonSession() *Session {
	return GetAnonSession(studioSite)
}

var studioSite *meta.Site

func init() {
	studioSite = generateStudioSite()
}

func GetStudioSite() *meta.Site {
	return studioSite
}

func generateStudioSite() *meta.Site {
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
