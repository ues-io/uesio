package sess

import "github.com/thecloudmasters/uesio/pkg/meta"

func GetAnonSession(site *meta.Site) *Session {

	session := NewSession(nil, &meta.User{
		Username:  "boot",
		FirstName: "Boot",
		LastName:  "User",
	}, site)

	session.SetPermissions(&meta.PermissionSet{
		AllowAllCollections: true,
		ViewAllRecords:      true,
	})

	return session
}

func GetStudioAnonSession() (*Session, error) {
	site, err := GetStudioSite()
	if err != nil {
		return nil, err
	}
	return GetAnonSession(site), nil
}

func GetStudioSite() (*meta.Site, error) {
	app := &meta.App{
		UniqueKey: "uesio/studio",
	}
	site := &meta.Site{
		UniqueKey: "uesio/studio:prod",
		Name:      "prod",
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
			"uesio/core": meta.BundleDefDep{
				Version: "v0.0.1",
			},
			"uesio/builder": meta.BundleDefDep{
				Version: "v0.0.1",
			},
			"uesio/io": meta.BundleDefDep{
				Version: "v0.0.1",
			},
		},
	})
	return site, nil
}
