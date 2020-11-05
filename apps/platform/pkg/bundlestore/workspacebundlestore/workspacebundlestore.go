package workspacebundlestore

import (
	"errors"
	"io"
	"reflect"

	"github.com/jinzhu/copier"
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
	group := item.GetCollection()
	conditions, err := item.GetConditions()
	if err != nil {
		return err
	}
	// Add the workspace id as a condition
	conditions = append(conditions, reqs.LoadRequestCondition{
		Field: "uesio.workspaceid",
		Value: session.GetWorkspaceID(),
	})
	err = datasource.PlatformLoad(
		[]metadata.CollectionableGroup{
			group,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				group.GetName(),
				group.GetFields(),
				conditions,
			),
		},
		session,
	)
	if err != nil {
		return err
	}

	length := reflect.Indirect(reflect.ValueOf(group)).Len()

	if length == 0 {
		return errors.New("Couldn't find item for platform load: " + item.GetKey())
	}
	if length > 1 {
		return errors.New("Duplicate items found: " + item.GetKey())
	}

	err = copier.Copy(item, group.GetItem(0))
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
	length := reflect.Indirect(reflect.ValueOf(group)).Len()

	for i := 0; i < length; i++ {
		item := group.GetItem(i)
		item.SetNamespace(session.GetWorkspaceApp())
	}
	return nil
}

// GetFileStream function
func (b *WorkspaceBundleStore) GetFileStream(namespace, version string, file *metadata.File, session *sess.Session) (io.ReadCloser, string, error) {
	return filesource.Download(file.Content, session)
}

// GetComponentPackStream function
func (b *WorkspaceBundleStore) GetComponentPackStream(namespace, version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	return nil, nil
}

// StoreItems function
func (b *WorkspaceBundleStore) StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error {
	return nil
}

// GetBundleDef function
func (b *WorkspaceBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error) {
	var by metadata.BundleDef
	by.Name = namespace
	bdc, err := bundleDependencyLoad(
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
	return &by, nil
}

func bundleDependencyLoad(conditions []reqs.LoadRequestCondition, session *sess.Session) (metadata.BundleDependencyCollection, error) {
	bdc := metadata.BundleDependencyCollection{}
	err := datasource.PlatformLoad(
		[]metadata.CollectionableGroup{
			&bdc,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				bdc.GetName(),
				bdc.GetFields(),
				conditions,
			),
		},
		session,
	)
	return bdc, err
}
