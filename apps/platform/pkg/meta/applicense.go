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
		AppID:         "crm",
		LicensedAppID: "material",
	},
	{
		AppID:         "crm",
		LicensedAppID: "sample",
	},
	{
		AppID:         "uesio",
		LicensedAppID: "material",
	},
	{
		AppID:         "studio",
		LicensedAppID: "uesio",
	},
	{
		AppID:         "studio",
		LicensedAppID: "material",
	},
}
