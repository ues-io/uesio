package workspacebundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// WorkspaceBundleStore struct
type WorkspaceBundleStore struct {
}

// GetItem function
func (b *WorkspaceBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {
	conditionsMap := item.GetConditions()
	// Add the workspace id as a condition
	conditionsMap["uesio.workspaceid"] = session.GetWorkspaceID()

	conditions := []adapt.LoadRequestCondition{}

	for field, value := range conditionsMap {
		conditions = append(conditions, adapt.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	item.SetNamespace(session.GetWorkspaceApp())

	return datasource.PlatformLoadOne(item, conditions, session)
}

// GetItems function
func (b *WorkspaceBundleStore) GetItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {
	// Add the workspace id as a condition
	loadConditions := []adapt.LoadRequestCondition{
		{
			Field: "uesio.workspaceid",
			Value: session.GetWorkspaceID(),
		},
	}

	for field, value := range conditions {
		loadConditions = append(loadConditions, adapt.LoadRequestCondition{
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
func (b *WorkspaceBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	stream, userFile, err := filesource.Download(file.Content.ID, session)
	if err != nil {
		return nil, err
	}
	file.FileName = userFile.Name
	return stream, nil
}

// GetComponentPackStream function
func (b *WorkspaceBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetBotStream function
func (b *WorkspaceBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, _, err := filesource.Download(bot.Content.ID, session)
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
func (b *WorkspaceBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error) {
	var by meta.BundleDef
	by.Name = namespace
	bdc := meta.BundleDependencyCollection{}
	err := datasource.PlatformLoadWithFields(
		&bdc,
		[]adapt.LoadRequestField{
			{
				ID: "uesio.id",
			},
			{
				ID: "uesio.workspaceid",
			},
			{
				ID: "uesio.bundle",
				Fields: []adapt.LoadRequestField{
					{
						ID: "uesio.namespace",
					},
					{
						ID: "uesio.major",
					},
					{
						ID: "uesio.minor",
					},
					{
						ID: "uesio.patch",
					},
				},
			},
		},
		[]adapt.LoadRequestCondition{
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
		by.Dependencies = map[string]meta.BundleDefDep{}
	}
	for i := range bdc {
		// TODO: Possibly recurse here to get sub dependencies
		by.Dependencies[bdc[i].GetBundleName()] = meta.BundleDefDep{
			Version: bdc[i].GetVersionString(),
		}
	}

	// TODO: Finish this
	_, err = getAppForNamespace(namespace, session)
	if err != nil {
		return nil, err
	}

	return &by, nil
}

func getAppForNamespace(namespace string, session *sess.Session) (*meta.App, error) {
	var app meta.App

	err := datasource.PlatformLoadOne(
		&app,
		[]adapt.LoadRequestCondition{
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
