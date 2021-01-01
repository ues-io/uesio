package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/localcache"

	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AddDependency func
func AddDependency(workspaceID string, bundleName string, bundleVersion string, session *sess.Session) error {
	//Just verify the bundle exists
	//Assumes structure of bundle IDs (may prove to be a mistake)
	bm, err := getBundleMetadataByID(bundleName+"_"+bundleVersion, session)
	if err != nil {
		return err
	}
	if bm.Namespace == session.GetWorkspaceApp() {
		return errors.New("cannot depend on self")
	}
	dep := metadata.BundleDependency{}
	existingDep, err := getBundleDependencyByName(workspaceID, bundleName, session)
	if err == nil {
		dep = *existingDep
		dep.BundleVersion = bundleVersion
	} else {
		dep = metadata.BundleDependency{
			WorkspaceID:   workspaceID,
			BundleName:    bundleName,
			BundleVersion: bundleVersion,
		}
	}

	bundleDeps := metadata.BundleDependencyCollection{
		dep,
	}

	_, err = PlatformSave([]PlatformSaveRequest{
		{
			Collection: &bundleDeps,
		},
	}, session)
	if err != nil {
		return err
	}
	clearCache(bundleName, workspaceID)
	return nil
}

func clearCache(namespace string, workspaceID string) {
	localcache.RemoveCacheEntry("workspace-dependency", namespace+":"+workspaceID)
}

// BundleDependencyLoad function
func BundleDependencyLoad(conditions []reqs.LoadRequestCondition, session *sess.Session) (metadata.BundleDependencyCollection, error) {
	bdc := metadata.BundleDependencyCollection{}
	err := PlatformLoad(&bdc, conditions, session)
	return bdc, err
}

func getBundleDependencyByName(workspaceID string, bundleName string, session *sess.Session) (*metadata.BundleDependency, error) {
	bdc, err := BundleDependencyLoad(
		[]reqs.LoadRequestCondition{
			{
				Field:    "uesio.workspaceid",
				Value:    workspaceID,
				Operator: "=",
			},
			{
				Field:    "uesio.bundlename",
				Value:    bundleName,
				Operator: "=",
			},
		},

		session)
	if err != nil {
		return nil, err
	}
	if len(bdc) < 1 {
		return nil, errors.New("unable to find dependency for " + workspaceID + ": " + bundleName)
	}
	return &bdc[0], nil
}

// RemoveDependency func
func RemoveDependency(workspaceID string, bundleName string, session *sess.Session) error {

	deleteReq := map[string]reqs.DeleteRequest{}
	deletePrimary := reqs.DeleteRequest{}
	dependency, err := getBundleDependencyByName(workspaceID, bundleName, session)
	if err != nil {
		return err
	}
	deletePrimary["uesio.id"] = dependency.ID
	deleteReq[dependency.ID] = deletePrimary
	clearCache(bundleName, workspaceID)
	return PlatformDelete("bundledependencies", deleteReq, session)
}
