package bundlestore

import (
	"bufio"
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// FileAdapter interface
type BundleStore interface {
	GetItem(namespace string, version string, objectname string, name string) (*bufio.Reader, io.Closer, error)
	ListItems(namespace string, version string, objectname string) ([]string, error)
	StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error
}

func StoreWorkspaceAsBundle(appName string, version string, itemStreams []reqs.ItemStream) error {
	bundleStoreInstance := GetBundleStoreByNamespace(appName)
	return bundleStoreInstance.StoreItems(appName, version, itemStreams)
}
func GetBundleStoreByNamespace(namespace string) BundleStore {
	if namespace == "material" || namespace == "sample" || namespace == "crm" || namespace == "uesio" {
		return GetBundleStore("local")
	}
	//TODO::We will need to flesh this out once it's possible to create bundles
	return GetBundleStore("platform")
}

//
func GetBundleStore(name string) BundleStore {
	if name == "local" {
		return &localbundlestore.LocalBundleStore{}
	}
	return &platformbundlestore.PlatformBundleStore{}
}
