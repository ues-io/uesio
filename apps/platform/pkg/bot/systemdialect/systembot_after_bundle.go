package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runBundleAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return cleanBundleFiles(request, connection, session)
}

func cleanBundleFiles(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	if len(request.Deletes) == 0 {
		return nil
	}

	ids := []string{}
	uniqueKeys := []string{}
	for i := range request.Deletes {
		ids = append(ids, request.Deletes[i].IDValue)
		uniqueKeys = append(uniqueKeys, request.Deletes[i].UniqueKey)
	}

	if len(ids) == 0 {
		return nil
	}

	bundleDependency := meta.BundleDependencyCollection{}
	err := datasource.PlatformLoad(&bundleDependency, &datasource.PlatformLoadOptions{
		Conditions: []wire.LoadRequestCondition{
			{
				Field:    "uesio/studio.bundle",
				Value:    ids,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}

	if len(bundleDependency) > 0 {
		return errors.New("Tried to delete a Bundle that is in use")
	}

	return clearFilesForBundles(uniqueKeys, session)

}

func clearFilesForBundles(ids []string, session *sess.Session) error {
	for _, id := range ids {
		appName, appVersion, _ := meta.ParseBundleUniqueKey(id)
		dest, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
			Namespace: appName,
			Version:   appVersion,
			Context:   session.Context(),
		})
		if err != nil {
			return err
		}
		if err = dest.DeleteBundle(); err != nil {
			return err
		}
	}
	return nil
}
