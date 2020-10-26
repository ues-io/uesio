package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AddDependency func
func AddDependency(workspaceID string, bundleID string, session *sess.Session) error {
	//Just verify the bundle exists
	bm, err := getBundleMetadataByID(bundleID, session)
	if err != nil {
		return err
	}
	if bm.Namespace == session.GetWorkspaceApp() {
		return errors.New("cannot depend on self")
	}
	bundleDeps := metadata.BundleDependencyCollection{
		metadata.BundleDependency{
			WorkspaceID: workspaceID,
			BundleID:    bundleID,
		},
	}

	_, err = PlatformSave([]PlatformSaveRequest{
		{
			Collection: &bundleDeps,
		},
	}, session)
	if err != nil {
		return err
	}
	return nil
}

func bundleDependencyLoad(conditions []reqs.LoadRequestCondition, session *sess.Session) (metadata.BundleDependencyCollection, error) {
	bdc := metadata.BundleDependencyCollection{}
	err := PlatformLoad(
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

// GetBundleDependenciesForWorkspace func
func GetBundleDependenciesForWorkspace(workspaceID string, session *sess.Session) (*metadata.BundleDependencyCollection, error) {
	bdc, err := bundleDependencyLoad(
		[]reqs.LoadRequestCondition{
			{
				Field:    "uesio.workspaceid",
				Value:    workspaceID,
				Operator: "=",
			},
		},

		session)
	if err != nil {
		return nil, err
	}
	return &bdc, nil
}
func getBundleDependency(workspaceID string, bundleID string, session *sess.Session) (*metadata.BundleDependency, error) {
	bdc, err := bundleDependencyLoad(
		[]reqs.LoadRequestCondition{
			{
				Field:    "uesio.workspaceid",
				Value:    workspaceID,
				Operator: "=",
			},
			{
				Field:    "uesio.bundleID",
				Value:    bundleID,
				Operator: "=",
			},
		},

		session)
	if err != nil {
		return nil, err
	}
	if len(bdc) < 1 {
		return nil, errors.New("unable to find dependency for " + workspaceID + ": " + bundleID)
	}
	return &bdc[0], nil
}

// RemoveDependency func
func RemoveDependency(workspaceID string, bundleID string, session *sess.Session) error {

	deleteReq := map[string]reqs.DeleteRequest{}
	deletePrimary := reqs.DeleteRequest{}
	dependency, err := getBundleDependency(workspaceID, bundleID, session)
	if err != nil {
		return err
	}
	deletePrimary["uesio.id"] = dependency.ID
	deleteReq[dependency.ID] = deletePrimary

	return PlatformDelete("bundledependencies", deleteReq, session)
}
