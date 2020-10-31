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

//TODO: Cache could get stale
func GetDependencyVersionForWorkspace(namespace string, session *sess.Session) (string, error) {
	workspaceID := session.GetWorkspaceID()
	entry, ok := localcache.GetCacheEntry("workspace-dependency", namespace+":"+workspaceID)
	if ok {
		return entry.(string), nil
	}
	dep, err := getBundleDependencyByName(workspaceID, namespace, session)
	if err != nil {
		return "", err
	}
	version := dep.BundleVersion
	localcache.SetCacheEntry("workspace-dependency", namespace+":"+workspaceID, version)
	return version, nil
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
func getBundleDependencyByName(workspaceID string, bundleName string, session *sess.Session) (*metadata.BundleDependency, error) {
	bdc, err := bundleDependencyLoad(
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

	return PlatformDelete("bundledependencies", deleteReq, session)
}
