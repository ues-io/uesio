package meta

// AppLicenseCollection slice
type AppLicenseCollection []AppLicense

// GetName function
func (a *AppLicenseCollection) GetName() string {
	return "applicences"
}
