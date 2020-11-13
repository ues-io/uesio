package metadata

// AppVersion struct
type AppVersion struct {
	ID           string
	AppRef       string
	App          *App
	VersionName  string
	Dependencies map[string]string
}

// DefaultAppVersions Seeds config values (these are necessary to make things work)
var DefaultAppVersions = AppVersionCollection{
	{
		AppRef:      "uesio",
		VersionName: "v0.0.1",
	},
	{
		AppRef:      "crm",
		VersionName: "v0.0.1",
		Dependencies: map[string]string{
			"uesio": "v0.0.1",
		},
	},
}
