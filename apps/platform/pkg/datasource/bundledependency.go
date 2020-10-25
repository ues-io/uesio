package datasource

import (
	"errors"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

func AddDependency(workspaceID string, bundleID string, site *metadata.Site, sess *session.Session) error {
	//Just verify the bundle exists
	bm, err := getBundleMetadataById(bundleID, site, sess)
	if err != nil {
		return err
	}
	if bm.Namespace == site.GetWorkspaceApp() {
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
	}, site, sess)
	if err != nil {
		return err
	}
	return nil
}

func bundleDependencyLoad(conditions []reqs.LoadRequestCondition, site *metadata.Site, sess *session.Session) (metadata.BundleDependencyCollection, error) {
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
		site,
		sess,
	)
	return bdc, err
}

func GetBundleDependenciesForWorkspace(workspaceID string, site *metadata.Site, sess *session.Session) (*metadata.BundleDependencyCollection, error) {
	bdc, err := bundleDependencyLoad(
		[]reqs.LoadRequestCondition{
			{
				Field:    "uesio.workspaceid",
				Value:    workspaceID,
				Operator: "=",
			},
		},

		site,
		sess)
	if err != nil {
		return nil, err
	}
	return &bdc, nil
}
func getBundleDependency(workspaceID string, bundleID string, site *metadata.Site, sess *session.Session) (*metadata.BundleDependency, error) {
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

		site,
		sess)
	if err != nil {
		return nil, err
	}
	if len(bdc) < 1 {
		return nil, errors.New("unable to find dependency for " + workspaceID + ": " + bundleID)
	}
	return &bdc[0], nil
}

func RemoveDependency(workspaceID string, bundleID string, site *metadata.Site, sess *session.Session) error {

	deleteReq := map[string]reqs.DeleteRequest{}
	deletePrimary := reqs.DeleteRequest{}
	dependency, err := getBundleDependency(workspaceID, bundleID, site, sess)
	if err != nil {
		return err
	}
	deletePrimary["uesio.id"] = dependency.ID
	deleteReq[dependency.ID] = deletePrimary

	return PlatformDelete("bundledependencies", deleteReq, site, sess)
}
