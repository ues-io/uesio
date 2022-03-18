package meta

// AppVersionCollection slice
type AppVersionCollection []AppVersion

// GetName function
func (a *AppVersionCollection) GetName() string {
	return "uesio/studio.appversions"
}
