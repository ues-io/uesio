package bundlestore

import (
	"errors"
	"io"
	"log"
	"os"

	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

var bundleStoreMap = map[string]BundleStore{}

// System variables
var BUNDLE_STORE_TYPE string

func init() {
	val, ok := os.LookupEnv("UESIO_BUNDLE_STORE_TYPE")
	if !ok {
		log.Fatal("Could not get environment variable: UESIO_BUNDLE_STORE_TYPE")
	}
	BUNDLE_STORE_TYPE = val
}

// RegisterBundleStore function
func RegisterBundleStore(name string, store BundleStore) {
	bundleStoreMap[name] = store
}

func GetBundleStoreByType(bundleStoreType string) (BundleStore, error) {
	adapter, ok := bundleStoreMap[bundleStoreType]
	if !ok {
		return nil, errors.New("No bundle store found of this type: " + bundleStoreType)
	}
	return adapter, nil
}

// PermissionError struct
type PermissionError struct {
	message string
}

func (e *PermissionError) Error() string { return e.message }

// NewPermissionError creates a new permission error
func NewPermissionError(message string) *PermissionError {
	return &PermissionError{
		message: message,
	}
}

// BundleStore interface
type BundleStore interface {
	GetItem(item meta.BundleableItem, version string, session *sess.Session) error
	GetManyItems(items []meta.BundleableItem, version string, session *sess.Session) error
	GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error
	HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) (bool, error)
	GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error)
	GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error)
	GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error)
	StoreItems(namespace, version string, itemStreams []ItemStream, session *sess.Session) error
	GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error)
}

// GetBundleStore function
func GetBundleStore(namespace string, session *sess.Session) (BundleStore, error) {
	// If we're in a workspace context and the namespace we're looking for is that workspace,
	// use the workspace bundlestore
	if namespace == "" {
		return nil, errors.New("Could not get bundlestore: No namespace provided")
	}
	if session.GetWorkspaceApp() == namespace {
		return GetBundleStoreByType("workspace")
	}
	if namespace == "uesio" || namespace == "studio" || namespace == "io" || namespace == "lab" || namespace == "docs" || namespace == "web" {
		return GetBundleStoreByType("system")
	}

	return GetBundleStoreByType(BUNDLE_STORE_TYPE)
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
