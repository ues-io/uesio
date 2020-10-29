package bundlestore

import (
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"gopkg.in/yaml.v3"
)

// BundleStore interface
type BundleStore interface {
	GetItem(namespace string, version string, objectname string, name string) (io.ReadCloser, error)
	ListItems(namespace string, version string, objectname string) ([]string, error)
	StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error
}

// StoreWorkspaceAsBundle function
func StoreWorkspaceAsBundle(appName string, version string, itemStreams []reqs.ItemStream) error {
	bundleStoreInstance := GetBundleStoreByNamespace(appName)
	return bundleStoreInstance.StoreItems(appName, version, itemStreams)
}

// GetBundleStoreByNamespace function
func GetBundleStoreByNamespace(namespace string) BundleStore {
	if namespace == "material" || namespace == "sample" || namespace == "crm" || namespace == "uesio" {
		return GetBundleStore("local")
	}
	//TODO::We will need to flesh this out once it's possible to create bundles
	return GetBundleStore("platform")
}

// GetBundleStore function
func GetBundleStore(name string) BundleStore {
	if name == "local" {
		return &localbundlestore.LocalBundleStore{}
	}
	return &platformbundlestore.PlatformBundleStore{}
}

// DecodeYAML function
func DecodeYAML(v interface{}, reader io.Reader) error {
	decoder := yaml.NewDecoder(reader)
	err := decoder.Decode(v)
	if err != nil {
		return err
	}

	return nil
}
