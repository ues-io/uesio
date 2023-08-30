package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runBundleAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return cleanBundleFiles(request, connection, session)
}

func cleanBundleFiles(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

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
		Conditions: []adapt.LoadRequestCondition{
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

func parseUniqueKey(UniqueKey string) (appName, appVersion string) {
	s := strings.Split(UniqueKey, ":")
	if len(s) != 4 {
		return "", ""
	}
	app := "v" + s[1] + "." + s[2] + "." + s[3]
	return s[0], app
}

func clearFilesForBundles(ids []string, session *sess.Session) error {
	for _, id := range ids {
		appName, appVersion := parseUniqueKey(id)
		dest, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
			Namespace: appName,
			Version:   appVersion,
		})
		if err != nil {
			return err
		}
		err = dest.DeleteBundle()
		if err != nil {
			return err
		}
	}
	return nil
}
