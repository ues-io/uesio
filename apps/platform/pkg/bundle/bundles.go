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
		if av.AppID == app && av.LicensedAppID == appToCheck {
			return &av, nil
		}
	}
	// TODO: Fix this
	// For now, everyone is licensed
	return &meta.AppLicense{}, nil
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
	return getAppBundleInternal(site.App.ID, site.Bundle.GetVersionString(), session)
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

func GetBundleStoreWithVersion(namespace string, session *sess.Session) (string, bundlestore.BundleStore, error) {
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

func HasAny(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session) (bool, error) {
	version, bs, err := GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		return false, err
	}
	return bs.HasAny(group, namespace, version, conditions, session)
}

// LoadAll function
func LoadAll(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session) error {
	version, bs, err := GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		return err
	}
	return bs.GetAllItems(group, namespace, version, conditions, session)
}

func LoadMany(items []meta.BundleableItem, session *sess.Session) error {
	// Coalate items into same namespace
	coalated := map[string][]meta.BundleableItem{}
	for _, item := range items {
		namespace := item.GetNamespace()
		_, ok := coalated[namespace]
		if !ok {
			coalated[namespace] = []meta.BundleableItem{}
		}
		coalated[namespace] = append(coalated[namespace], item)
	}
	for namespace, items := range coalated {
		version, bs, err := GetBundleStoreWithVersion(namespace, session)
		if err != nil {
			return err
		}

		err = bs.GetManyItems(items, version, session)
		if err != nil {
			return err
		}

	}
	return nil
}

// Load function
func Load(item meta.BundleableItem, session *sess.Session) error {
	version, bs, err := GetBundleStoreWithVersion(item.GetNamespace(), session)
	if err != nil {
		return err
	}
	return bs.GetItem(item, version, session)
}

//GetFileStream function
func GetFileStream(file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(file.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetFileStream(version, file, session)
}

//GetComponentPackStream function
func GetComponentPackStream(componentPack *meta.ComponentPack, buildMode bool, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(componentPack.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetComponentPackStream(version, buildMode, componentPack, session)
}

//GetBotStream function
func GetBotStream(bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(bot.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetBotStream(version, bot, session)
}
