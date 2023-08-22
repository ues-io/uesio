package sess

import "github.com/thecloudmasters/uesio/pkg/meta"

func GetAnonSession(site *meta.Site) *Session {

	return NewSession(nil, &meta.User{
		Username:  "boot",
		FirstName: "Boot",
		LastName:  "User",
		Permissions: &meta.PermissionSet{
			AllowAllCollections: true,
			ViewAllRecords:      true,
			AllowAllRoutes:      true,
			AllowAllViews:       true,
		},
	}, site)

}

func GetStudioAnonSession() *Session {
	return GetAnonSession(GetStudioSite())
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
