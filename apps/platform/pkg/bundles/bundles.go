package bundles

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

func getAppLicense(app, appToCheck string) (*metadata.AppLicense, error) {
	for _, av := range metadata.DefaultAppLicenses {
		if av.AppRef == app && av.LicensedAppRef == appToCheck {
			return &av, nil
		}
	}
	return nil, nil
}

// GetAppBundle function
func GetAppBundle(session *sess.Session) (*metadata.BundleDef, error) {
	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()
	return getAppBundleInternal(appName, appVersion, session)
}

// GetSiteAppBundle gets the app bundle for the site without regard for the workspace
func GetSiteAppBundle(site *metadata.Site) (*metadata.BundleDef, error) {
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

func getAppBundleInternal(appName, appVersion string, session *sess.Session) (*metadata.BundleDef, error) {
	entry, ok := localcache.GetCacheEntry("bundle-yaml", appName+":"+appVersion)
	if ok {
		return entry.(*metadata.BundleDef), nil
	}
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
	localcache.SetCacheEntry("bundle-yaml", appName+":"+appVersion, bundleyaml)
	return bundleyaml, nil
}

func getVersion(namespace string, session *sess.Session) (string, error) {

	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()

	if appName == namespace {
		// We always have a license to our own app.
		return appVersion, nil
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
func LoadAllFromAny(group metadata.BundleableGroup, conditions reqs.BundleConditions, session *sess.Session) error {
	// Get all avaliable namespaces
	namespaces := session.GetContextNamespaces()
	for namespace := range namespaces {
		LoadAll(group, namespace, conditions, session)
	}
	return nil
}

// LoadAll function
func LoadAll(group metadata.BundleableGroup, namespace string, conditions reqs.BundleConditions, session *sess.Session) error {
	version, bs, err := getBundleStoreWithVersion(namespace, session)
	if err != nil {
		return err
	}
	return bs.GetItems(group, namespace, version, conditions, session)
}

// Load function
func Load(item metadata.BundleableItem, session *sess.Session) error {
	namespace := item.GetNamespace()
	version, bs, err := getBundleStoreWithVersion(namespace, session)
	if err != nil {
		return err
	}
	return bs.GetItem(item, version, session)
}

//GetFileStream function
func GetFileStream(file *metadata.File, session *sess.Session) (io.ReadCloser, error) {
	namespace := file.GetNamespace()
	version, bs, err := getBundleStoreWithVersion(namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetFileStream(version, file, session)
}

//GetComponentPackStream function
func GetComponentPackStream(componentPack *metadata.ComponentPack, buildMode bool, session *sess.Session) (io.ReadCloser, error) {
	namespace := componentPack.GetNamespace()
	version, bs, err := getBundleStoreWithVersion(namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetComponentPackStream(version, buildMode, componentPack, session)
}

//GetBotStream function
func GetBotStream(bot *metadata.Bot, session *sess.Session) (io.ReadCloser, error) {
	namespace := bot.GetNamespace()
	version, bs, err := getBundleStoreWithVersion(namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetBotStream(version, bot, session)
}
