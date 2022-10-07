package bundle

import (
	"errors"
	"fmt"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getAppLicense(app, appToCheck string) (*meta.AppLicense, error) {
	for _, av := range meta.DefaultAppLicenses {
		if av.AppID == app && av.LicensedAppID == appToCheck {
			return av, nil
		}
	}
	// TODO: Fix this
	// For now, everyone is licensed
	return &meta.AppLicense{}, nil
}

func GetAppBundle(session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {
	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()
	return getAppBundleInternal(appName, appVersion, session, connection)
}

// GetSiteAppBundle gets the app bundle for the site without regard for the workspace
func GetSiteAppBundle(site *meta.Site) (*meta.BundleDef, error) {
	// MockSession. Since we're always just going to the local bundles store
	// we're good with just a fake session.
	session := &sess.Session{}
	session.SetSite(site)
	return getAppBundleInternal(site.GetAppFullName(), site.Bundle.GetVersionString(), session, nil)
}

func ClearAppBundleCache(session *sess.Session) {
	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()
	localcache.RemoveCacheEntry("bundle-yaml", appName+":"+appVersion)
}

func getAppBundleInternal(appName, appVersion string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error) {

	bs, err := bundlestore.GetBundleStore(appName, session)
	if err != nil {
		return nil, err
	}
	bundleyaml, err := bs.GetBundleDef(appName, appVersion, session, connection)
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

	_, _, err := meta.ParseNamespace(namespace)
	if err != nil {
		return "", errors.New("Bad namespace: " + namespace)
	}

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

	// Adding the builder for now, there is probably a better way to get it to work
	if namespace == "uesio/core" || namespace == "uesio/builder" {
		// Everyone has access to uesio/core
		return "v0.0.1", nil
	}

	bundle := session.GetContextAppBundle()

	if bundle == nil {
		return "", fmt.Errorf("No Bundle info provided for: %s", appName)
	}

	depBundle, hasDep := bundle.Dependencies[namespace]
	if !hasDep {
		return "", fmt.Errorf("%s doesn't have %s installed", appName, namespace)
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

func LoadAllFromAny(group meta.BundleableGroup, conditions meta.BundleConditions, session *sess.Session) error {
	// Get all avaliable namespaces
	namespaces := session.GetContextNamespaces()
	for _, namespace := range namespaces {
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

func LoadAll(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session) error {
	version, bs, err := GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		fmt.Println("Failed Load All: " + group.GetName())
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
			fmt.Println("Failed load many")
			for _, item := range items {
				fmt.Println(item.GetKey())
			}
			return err
		}

		err = bs.GetManyItems(items, version, session)
		if err != nil {
			return err
		}

	}
	return nil
}

func Load(item meta.BundleableItem, session *sess.Session) error {
	version, bs, err := GetBundleStoreWithVersion(item.GetNamespace(), session)
	if err != nil {
		fmt.Println("Failed load one: " + item.GetKey() + " : " + err.Error())
		return err
	}
	return bs.GetItem(item, version, session)
}

func GetFileStream(file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(file.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetFileStream(version, file, session)
}

func GetComponentPackStream(componentPack *meta.ComponentPack, path string, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(componentPack.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetComponentPackStream(version, path, componentPack, session)
}

func GetBotStream(bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(bot.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetBotStream(version, bot, session)
}

func GetGeneratorBotTemplateStream(template string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	version, bs, err := GetBundleStoreWithVersion(bot.Namespace, session)
	if err != nil {
		return nil, err
	}
	return bs.GetGenerateBotTemplateStream(template, version, bot, session)
}

func IsValid(items []meta.BundleableItem, session *sess.Session, connection adapt.Connection) error {

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

		err = bs.HasAllItems(items, version, session, connection)
		if err != nil {
			return err
		}

	}
	return nil
}
