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

	bundle := session.GetContextAppBundle()

	if bundle == nil {
		return "", fmt.Errorf("No Bundle info provided for: %s", appName)
	}

	depBundle, hasDep := bundle.Dependencies[namespace]
	if !hasDep {
		return "", fmt.Errorf("%s doesn't have %s installed", appName, namespace)
	}

	if bundle.Licenses == nil {
		return "", fmt.Errorf("No License info provided for: %s", appName)
	}

	license, hasLicense := bundle.Licenses[namespace]
	if !hasLicense {
		return "", fmt.Errorf("%s doesn't have a license to use %s", appName, namespace)
	}

	if !license.Active {
		return "", fmt.Errorf("%s has a inactive license to use %s ", appName, namespace)
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

func LoadAllFromAny(group meta.BundleableGroup, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {
	return LoadAllFromNamespaces(session.GetContextNamespaces(), group, conditions, session, connection)
}

func LoadAllFromNamespaces(namespaces []string, group meta.BundleableGroup, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {
	for _, namespace := range namespaces {
		err := LoadAll(group, namespace, conditions, session, connection)
		if err != nil {
			return err
		}
	}
	return nil
}

func HasAny(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) (bool, error) {
	version, bs, err := GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		return false, err
	}
	return bs.HasAny(group, namespace, version, conditions, session, connection)
}

func LoadAll(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {
	version, bs, err := GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		fmt.Println("Failed Load All: " + group.GetName())
		return err
	}
	return bs.GetAllItems(group, namespace, version, conditions, session, connection)
}

func LoadMany(items []meta.BundleableItem, session *sess.Session, connection adapt.Connection) error {
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

		err = bs.GetManyItems(items, version, session, connection)
		if err != nil {
			return err
		}

	}
	return nil
}

func Load(item meta.BundleableItem, session *sess.Session, connection adapt.Connection) error {
	version, bs, err := GetBundleStoreWithVersion(item.GetNamespace(), session)
	if err != nil {
		fmt.Println("Failed load one: " + item.GetKey() + " : " + err.Error())
		return err
	}
	return bs.GetItem(item, version, session, connection)
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
