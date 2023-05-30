package bundlestore

import (
	"errors"
	"io"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

var bundleStoreMap = map[string]BundleStore{}

var systemBundles = map[string]bool{
	"uesio/core":    true,
	"uesio/studio":  true,
	"uesio/io":      true,
	"uesio/docs":    true,
	"uesio/web":     true,
	"uesio/cms":     true,
	"uesio/crm":     true,
	"uesio/builder": true,
}

func IsSystemBundle(namespace string) bool {
	_, isSystemBundle := systemBundles[namespace]
	return isSystemBundle
}

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

type PermissionError struct {
	message string
}

func (e *PermissionError) Error() string { return e.message }

func NewPermissionError(message string) *PermissionError {
	return &PermissionError{
		message: message,
	}
}

type BundleStore interface {
	GetItem(item meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error
	GetManyItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error
	GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) error
	HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session, connection adapt.Connection) (bool, error)
	GetItemAttachment(item meta.AttachableItem, version string, path string, session *sess.Session) (time.Time, io.ReadSeeker, error)
	GetAttachmentPaths(item meta.AttachableItem, version string, session *sess.Session) ([]string, error)
	StoreItem(namespace, version, path string, reader io.Reader, session *sess.Session) error
	GetBundleDef(namespace, version string, session *sess.Session, connection adapt.Connection) (*meta.BundleDef, error)
	HasAllItems(items []meta.BundleableItem, version string, session *sess.Session, connection adapt.Connection) error
	DeleteBundle(namespace, version string, session *sess.Session) error
}

func GetBundleStore(namespace string, session *sess.Session) (BundleStore, error) {
	// If we're in a workspace context and the namespace we're looking for is that workspace,
	// use the workspace bundlestore
	if namespace == "" {
		return nil, errors.New("Could not get bundlestore: No namespace provided")
	}

	_, _, err := meta.ParseNamespace(namespace)
	if err != nil {
		return nil, err
	}

	workspace := session.GetWorkspace()
	if workspace != nil && workspace.GetAppFullName() == namespace {
		return GetBundleStoreByType("workspace")
	}

	if IsSystemBundle(namespace) {
		return GetBundleStoreByType("system")
	}

	return GetBundleStoreByType("platform")
}

func DecodeYAML(v interface{}, reader io.Reader) error {
	decoder := yaml.NewDecoder(reader)
	err := decoder.Decode(v)
	if err != nil {
		return err
	}

	return nil
}
