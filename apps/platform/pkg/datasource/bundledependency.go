package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/localcache"

	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AddDependency func
func AddDependency(workspaceID string, bundleName string, bundleVersion string, session *sess.Session) error {
	//Just verify the bundle exists
	//Assumes structure of bundle IDs (may prove to be a mistake)
	bm := metadata.Bundle{}
	err := PlatformLoadOne(
		&bm,
		[]adapters.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: bundleName + "_" + bundleVersion,
			},
		},
		session,
	)
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

	err = PlatformSaveOne(&dep, nil, session)
	if err != nil {
		return err
	}
	clearCache(bundleName, workspaceID)
	return nil
}

func clearCache(namespace string, workspaceID string) {
	localcache.RemoveCacheEntry("workspace-dependency", namespace+":"+workspaceID)
}

func getBundleDependencyByName(workspaceID string, bundleName string, session *sess.Session) (*metadata.BundleDependency, error) {
	bdc := metadata.BundleDependencyCollection{}
	err := PlatformLoad(
		&bdc,
		[]adapters.LoadRequestCondition{
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

	deleteReq := map[string]adapters.DeleteRequest{}
	deletePrimary := adapters.DeleteRequest{}
	dependency, err := getBundleDependencyByName(workspaceID, bundleName, session)
	if err != nil {
		return err
	}
	deletePrimary["uesio.id"] = dependency.ID
	deleteReq[dependency.ID] = deletePrimary
	clearCache(bundleName, workspaceID)
	return PlatformDelete("bundledependencies", deleteReq, session)
}
