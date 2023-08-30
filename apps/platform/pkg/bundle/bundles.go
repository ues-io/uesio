package bundle

import (
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/localcache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func ClearAppBundleCache(session *sess.Session) {
	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()
	localcache.RemoveCacheEntry("bundle-yaml", appName+":"+appVersion)
}

func GetSiteBundleDef(site *meta.Site, connection adapt.Connection) (*meta.BundleDef, error) {
	return GetVersionBundleDef(site.GetAppFullName(), site.Bundle.GetVersionString(), connection)
}

func GetVersionBundleDef(namespace, version string, connection adapt.Connection) (*meta.BundleDef, error) {
	bs, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  namespace,
		Version:    version,
		Connection: connection,
	})
	if err != nil {
		return nil, err
	}
	return bs.GetBundleDef()
}

func GetWorkspaceBundleDef(workspace *meta.Workspace, connection adapt.Connection) (*meta.BundleDef, error) {

	bs, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  workspace.GetAppFullName(),
		Version:    workspace.Name,
		Connection: connection,
		Workspace:  workspace,
	})
	if err != nil {
		return nil, err
	}
	return bs.GetBundleDef()
}

func GetVersion(namespace string, session *sess.Session) (string, error) {

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

func GetBundleStoreConnection(namespace string, session *sess.Session, connection adapt.Connection) (bundlestore.BundleStoreConnection, error) {
	version, err := GetVersion(namespace, session)
	if err != nil {
		return nil, err
	}

	return bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:    namespace,
		Version:      version,
		Connection:   connection,
		Workspace:    session.GetWorkspace(),
		Permissions:  session.GetContextPermissions(),
		AllowPrivate: session.GetContextAppName() == namespace,
	})
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
	bs, err := GetBundleStoreConnection(namespace, session, connection)
	if err != nil {
		return false, err
	}
	return bs.HasAny(group, conditions)
}

func LoadAll(group meta.BundleableGroup, namespace string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error {
	bs, err := GetBundleStoreConnection(namespace, session, connection)
	if err != nil {
		fmt.Println("Failed Load All: " + group.GetName())
		return err
	}
	return bs.GetAllItems(group, conditions)
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
		bs, err := GetBundleStoreConnection(namespace, session, connection)
		if err != nil {
			fmt.Println("Failed load many")
			for _, item := range items {
				fmt.Println(item.GetKey())
			}
			return err
		}

		err = bs.GetManyItems(items)
		if err != nil {
			return err
		}

	}
	return nil
}

func Load(item meta.BundleableItem, session *sess.Session, connection adapt.Connection) error {
	bs, err := GetBundleStoreConnection(item.GetNamespace(), session, connection)
	if err != nil {
		fmt.Println("Failed load one: " + item.GetKey() + " : " + err.Error())
		return err
	}
	return bs.GetItem(item)
}

func GetItemAttachment(item meta.AttachableItem, path string, session *sess.Session) (time.Time, io.ReadSeeker, error) {
	bs, err := GetBundleStoreConnection(item.GetNamespace(), session, nil)
	if err != nil {
		return time.Time{}, nil, err
	}
	return bs.GetItemAttachment(item, path)
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
		bs, err := GetBundleStoreConnection(namespace, session, connection)
		if err != nil {
			return err
		}

		err = bs.HasAllItems(items)
		if err != nil {
			return err
		}

	}
	return nil
}
