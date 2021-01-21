package workspacebundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// WorkspaceBundleStore struct
type WorkspaceBundleStore struct {
}

// GetItem function
func (b *WorkspaceBundleStore) GetItem(item metadata.BundleableItem, version string, session *sess.Session) error {
	conditionsMap := item.GetConditions()
	// Add the workspace id as a condition
	conditionsMap["uesio.workspaceid"] = session.GetWorkspaceID()

	conditions := []adapters.LoadRequestCondition{}

	for field, value := range conditionsMap {
		conditions = append(conditions, adapters.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	item.SetNamespace(session.GetWorkspaceApp())

	return datasource.PlatformLoadOne(item, conditions, session)
}

// GetItems function
func (b *WorkspaceBundleStore) GetItems(group metadata.BundleableGroup, namespace, version string, conditions metadata.BundleConditions, session *sess.Session) error {
	// Add the workspace id as a condition
	loadConditions := []adapters.LoadRequestCondition{
		{
			Field: "uesio.workspaceid",
			Value: session.GetWorkspaceID(),
		},
	}

	for field, value := range conditions {
		loadConditions = append(loadConditions, adapters.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	return datasource.PlatformLoad(&WorkspaceLoadCollection{
		Collection: group,
		Namespace:  namespace,
	}, loadConditions, session)

}

// GetFileStream function
func (b *WorkspaceBundleStore) GetFileStream(version string, file *metadata.File, session *sess.Session) (io.ReadCloser, error) {
	stream, userFile, err := filesource.Download(file.Content, session)
	if err != nil {
		return nil, err
	}
	file.FileName = userFile.Name
	return stream, nil
}

// GetComponentPackStream function
func (b *WorkspaceBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetBotStream function
func (b *WorkspaceBundleStore) GetBotStream(version string, bot *metadata.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, _, err := filesource.Download(bot.Content, session)
	if err != nil {
		return nil, err
	}
	return stream, nil
}

// StoreItems function
func (b *WorkspaceBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream) error {
	return errors.New("Tried to store items in the workspace bundle store")
}

// GetBundleDef function
func (b *WorkspaceBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error) {
	var by metadata.BundleDef
	by.Name = namespace
	bdc := metadata.BundleDependencyCollection{}
	err := datasource.PlatformLoad(
		&bdc,
		[]adapters.LoadRequestCondition{
			{
				Field:    "uesio.workspaceid",
				Value:    namespace + "_" + version,
				Operator: "=",
			},
		},

		session)
	if err != nil {
		return nil, err
	}
	if len(bdc) != 0 {
		by.Dependencies = map[string]metadata.BundleDefDep{}
	}
	for _, bd := range bdc {
		// TODO: Possibly recurse here to get sub dependencies
		by.Dependencies[bd.BundleName] = metadata.BundleDefDep{
			Version: bd.BundleVersion,
		}
	}

	// TODO: Finish this
	_, err = getAppForNamespace(namespace, session)
	if err != nil {
		return nil, err
	}

	return &by, nil
}

func getAppForNamespace(namespace string, session *sess.Session) (*metadata.App, error) {
	var app metadata.App

	err := datasource.PlatformLoadOne(
		&app,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: namespace,
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}

	return &app, nil
}
