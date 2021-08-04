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
	conditionsMap["studio.workspaceid"] = session.GetWorkspaceID()

	conditions := []adapt.LoadRequestCondition{}

	for field, value := range conditionsMap {
		conditions = append(conditions, adapt.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	item.SetNamespace(session.GetWorkspaceApp())

	return datasource.PlatformLoadOne(item, conditions, session.RemoveWorkspaceContext())
}

// GetItems function
func (b *WorkspaceBundleStore) GetItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {
	// Add the workspace id as a condition
	loadConditions := []adapt.LoadRequestCondition{
		{
			Field: "studio.workspaceid",
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
	}, loadConditions, session.RemoveWorkspaceContext())

}

// GetFileStream function
func (b *WorkspaceBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	stream, userFile, err := filesource.Download(file.Content.ID, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	file.FileName = userFile.FileName
	return stream, nil
}

// GetComponentPackStream function
func (b *WorkspaceBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetBotStream function
func (b *WorkspaceBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, _, err := filesource.Download(bot.Content.ID, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	return stream, nil
}

// StoreItems function
func (b *WorkspaceBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream, session *sess.Session) error {
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
				ID: "studio.id",
			},
			{
				ID: "studio.workspaceid",
			},
			{
				ID: "studio.bundle",
				Fields: []adapt.LoadRequestField{
					{
						ID: "uesio.appid",
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
				Field:    "studio.workspaceid",
				Value:    namespace + "_" + version,
				Operator: "=",
			},
		},

		session.RemoveWorkspaceContext())
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

	workspace := session.GetWorkspace()
	if workspace == nil {
		return nil, errors.New("No workspace found")
	}
	by.DefaultProfile = workspace.DefaultProfile
	by.PublicProfile = workspace.PublicProfile
	by.HomeRoute = workspace.HomeRoute
	by.LoginRoute = workspace.LoginRoute
	by.DefaultTheme = workspace.DefaultTheme

	return &by, nil
}
