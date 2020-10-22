package metadata

import (
	"errors"

	"github.com/icza/session"
)

// AppVersion struct
type AppVersion struct {
	ID           string
	AppRef       string
	App          *App
	VersionName  string
	Dependencies map[string]string
}

// Seed config values (these are necessary to make things work)
var defaultAppVersions = AppVersionCollection{
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

// GetValidNamespaces function
func GetValidNamespaces(site *Site, sess *session.Session) (map[string]bool, error) {
	siteWorkspaceNamespace := site.GetWorkspaceApp()
	namespaces := map[string]bool{}
	// TODO: Look up the dependencies of this workspace and return
	// A list of the bundles that this workspace has installed.
	for _, av := range defaultAppVersions {
		namespaces[av.AppRef] = true
	}

	namespaces[siteWorkspaceNamespace] = true

	return namespaces, nil
}

// GetAppVersion key
func GetAppVersion(appName, appVersion string) (*AppVersion, error) {
	for _, av := range defaultAppVersions {
		if av.AppRef == appName && av.VersionName == appVersion {
			return &av, nil
		}
	}
	return nil, nil
}

// GetVersionFromSite function
func GetVersionFromSite(namespace string, site *Site) (string, error) {

	// Get the site's version
	if site.AppRef == namespace {
		// We always have a license to our own app.
		return site.VersionRef, nil
	}

	// Check to see if we have a license to use this namespace
	license, err := GetAppLicense(site.AppRef, namespace)
	if err != nil {
		return "", err
	}

	if license == nil {
		return "", errors.New("You aren't licensed to use that app: " + namespace)
	}

	version, err := GetAppVersion(site.AppRef, site.VersionRef)
	if err != nil {
		return "", err
	}

	if version == nil {
		return "", errors.New("That version doesn't exist for that bundle: " + site.AppRef + " " + site.VersionRef)
	}

	dependencyVersion, hasDep := version.Dependencies[namespace]
	if !hasDep {
		return "", errors.New("You don't have that dependency installed: " + namespace)
	}

	return dependencyVersion, nil
}
