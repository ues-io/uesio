package meta

// AppLicense struct
type AppLicense struct {
	ID            string
	AppID         string
	LicensedAppID string
}

// DefaultAppLicenses Seed config values (these are necessary to make things work)
var DefaultAppLicenses = AppLicenseCollection{
	{
		AppID:         "crm",
		LicensedAppID: "uesio",
	},
	{
		AppID:         "studio",
		LicensedAppID: "uesio",
	},
}
