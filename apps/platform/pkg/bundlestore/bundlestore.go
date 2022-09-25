package bundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

var bundleStoreMap = map[string]BundleStore{}

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
	GetItem(item meta.BundleableItem, version string, session *sess.Session) error
	GetManyItems(items []meta.BundleableItem, version string, session *sess.Session) error
	GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error
	HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) (bool, error)
	GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error)
	GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error)
	GetGenerateBotTemplateStream(template, version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error)
	GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error)
	StoreItems(namespace, version string, itemStreams []ItemStream, session *sess.Session) error
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
	if namespace == "uesio/core" || namespace == "uesio/studio" || namespace == "uesio/io" || namespace == "uesio/lab" || namespace == "uesio/docs" || namespace == "uesio/web" || namespace == "uesio/cms" {
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
