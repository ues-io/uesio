package bundle

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getAppLicense(app, appToCheck string) (*meta.AppLicense, error) {
	for _, av := range meta.DefaultAppLicenses {
		if av.AppRef == app && av.LicensedAppRef == appToCheck {
			return &av, nil
		}
	}
	return nil, nil
}

// GetAppBundle function
func GetAppBundle(session *sess.Session) (*meta.BundleDef, error) {
	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()
	return getAppBundleInternal(appName, appVersion, session)
}

// GetSiteAppBundle gets the app bundle for the site without regard for the workspace
func GetSiteAppBundle(site *meta.Site) (*meta.BundleDef, error) {
	// MockSession. Since we're always just going to the local bundles store
	// we're good with just a fake session.
	session := &sess.Session{}
	session.SetSite(site)
	return getAppBundleInternal(site.AppRef, site.VersionRef, session)
}

// ClearAppBundleCache entry
func ClearAppBundleCache(session *sess.Session) {
	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()
	localcache.RemoveCacheEntry("bundle-yaml", appName+":"+appVersion)
}

func getAppBundleInternal(appName, appVersion string, session *sess.Session) (*meta.BundleDef, error) {

	bs, err := bundlestore.GetBundleStore(appName, session)
	if err != nil {
		return nil, err
	}
	bundleyaml, err := bs.GetBundleDef(appName, appVersion, session)
	if err != nil {
		return nil, err
	}
	if bundleyaml == nil {
		return nil, errors.New("No bundleyaml found for app: " + appName + " with version:" + appVersion)
	}
	return bundleyaml, nil
}

func getVersion(namespace string, session *sess.Session) (string, error) {

	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()

	if appName == namespace {
		// We always have a license to our own app.
		return appVersion, nil
	}

	if namespace == "uesio" {
		return "v0.0.1", nil
	}
	if namespace == "studio" && session.GetWorkspaceID() != "" {
		return "v0.0.1", nil
	}

	// Check to see if we have a license to use this namespace
	license, err := getAppLicense(appName, namespace)
	if err != nil {
		return "", err
	}

	if license == nil {
		return "", errors.New("You aren't licensed to use that app: " + namespace)
	}

	bundle := session.GetContextAppBundle()

	if bundle == nil {
		return "", errors.New("That version doesn't exist for that bundle: " + appName + " " + appVersion)
	}

	depBundle, hasDep := bundle.Dependencies[namespace]
	if !hasDep {
		return "", errors.New("You don't have that dependency installed: " + namespace)
	}

	return depBundle.Version, nil
}

func getBundleStoreWithVersion(namespace string, session *sess.Session) (string, bundlestore.BundleStore, error) {
	version, err := getVersion(namespace, session)
	if err != nil {
		return "", nil, err
	}
	bs, err := bundlestore.GetBundleStore(namespace, session)
	if err != nil {
		return "", nil, err
	}
	return version, bs, nil
}

// LoadAllFromAny function
func LoadAllFromAny(group meta.BundleableGroup, conditions meta.BundleConditions, session *sess.Session) error {
	// Get all avaliable namespaces
	namespaces := session.GetContextNamespaces()
	for namespace := range namespaces {
		err := LoadAll(group, namespace, conditions, session)
		if err != nil {
			return err
		}
	}
	return nil
}

// LoadAll function
func LoadAll(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session) error {
	version, bs, err := getBundleStoreWithVersion(namespace, session)
	if err != nil {
		return err
	}
	return bs.GetItems(group, namespace, version, conditions, session)
}

// Load function
func Load(item meta.BundleableItem, session *sess.Session) error {
	version, bs, err := getBundleStoreWithVersion(item.GetNamespace(), session)
	if err != nil {
		return err
	}
	return bs.GetItem(item, version, session)
}

//GetFileStream function
func GetFileStream(file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := getBundleStoreWithVersion(file.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetFileStream(version, file, session)
}

//GetComponentPackStream function
func GetComponentPackStream(componentPack *meta.ComponentPack, buildMode bool, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := getBundleStoreWithVersion(componentPack.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetComponentPackStream(version, buildMode, componentPack, session)
}

//GetBotStream function
func GetBotStream(bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := getBundleStoreWithVersion(bot.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetBotStream(version, bot, session)
}
