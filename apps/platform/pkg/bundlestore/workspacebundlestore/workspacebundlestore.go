package workspacebundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// WorkspaceBundleStore struct
type WorkspaceBundleStore struct {
}

// GetItem function
func (b *WorkspaceBundleStore) GetItem(item metadata.BundleableItem, version string, session *sess.Session) error {
	conditions, err := item.GetConditions()
	if err != nil {
		return err
	}
	// Add the workspace id as a condition
	conditions = append(conditions, reqs.LoadRequestCondition{
		Field: "uesio.workspaceid",
		Value: session.GetWorkspaceID(),
	})
	err = datasource.PlatformLoadOne(
		item,
		conditions,
		session,
	)
	if err != nil {
		return err
	}

	item.SetNamespace(session.GetWorkspaceApp())

	return nil
}

// GetItems function
func (b *WorkspaceBundleStore) GetItems(group metadata.BundleableGroup, namespace, version string, conditions reqs.BundleConditions, session *sess.Session) error {
	// Add the workspace id as a condition
	loadConditions := []reqs.LoadRequestCondition{
		{
			Field: "uesio.workspaceid",
			Value: session.GetWorkspaceID(),
		},
	}

	for field, value := range conditions {
		loadConditions = append(loadConditions, reqs.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	err := datasource.PlatformLoad(
		[]metadata.CollectionableGroup{
			group,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				group.GetName(),
				group.GetFields(),
				loadConditions,
			),
		},
		session,
	)
	if err != nil {
		return err
	}

	return group.Loop(func(item metadata.CollectionableItem) error {
		item.SetNamespace(namespace)
		return nil
	})

}

// GetFileStream function
func (b *WorkspaceBundleStore) GetFileStream(version string, file *metadata.File, session *sess.Session) (io.ReadCloser, error) {
	stream, userFile, err := filesource.Download(file.Content, session)
	if err != nil {
		return nil, err
	}
	file.MimeType = userFile.MimeType
	file.FileName = userFile.Name
	return stream, nil
}

// GetComponentPackStream function
func (b *WorkspaceBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// GetBotStream function
func (b *WorkspaceBundleStore) GetBotStream(version string, bot *metadata.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, userFile, err := filesource.Download(bot.Content, session)
	if err != nil {
		return nil, err
	}
	bot.FileName = userFile.Name
	return stream, nil
}

// StoreItems function
func (b *WorkspaceBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	return errors.New("Tried to store items in the workspace bundle store")
}

// GetBundleDef function
func (b *WorkspaceBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error) {
	var by metadata.BundleDef
	by.Name = namespace
	bdc, err := datasource.BundleDependencyLoad(
		[]reqs.LoadRequestCondition{
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
		[]reqs.LoadRequestCondition{
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
