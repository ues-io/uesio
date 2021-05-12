package meta

// AppVersion struct
type AppVersion struct {
	ID           string
	AppID        string
	App          *App
	VersionName  string
	Dependencies map[string]string
}

// DefaultAppVersions Seeds config values (these are necessary to make things work)
var DefaultAppVersions = AppVersionCollection{
	{
		AppID:       "uesio",
		VersionName: "v0.0.1",
	},
	{
		AppID:       "crm",
		VersionName: "v0.0.1",
		Dependencies: map[string]string{
			"uesio": "v0.0.1",
		},
	},
}
