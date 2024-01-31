package systemdialect

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runInstallBundleListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID, err := getRequiredParameter(params, "app")
	if err != nil {
		return nil, err
	}

	version, err := getRequiredParameter(params, "version")
	if err != nil {
		return nil, err
	}

	workspaceUniqueKey, err := getRequiredParameter(params, "workspace")
	if err != nil {
		return nil, err
	}

	if bundlestore.IsSystemBundle(appID) {
		return nil, exceptions.NewForbiddenException("cannot install a bundle for a system app")
	}

	if !session.GetSitePermissions().HasNamedPermission("uesio/studio.workspace_admin") {
		return nil, exceptions.NewForbiddenException("you must be a workspace admin to install bundles")
	}

	workspace, err := datasource.QueryWorkspaceForWrite(workspaceUniqueKey, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to install bundles for workspace %s", workspaceUniqueKey))
	}

	major, minor, patch, err := meta.ParseVersionString(version)
	if err != nil {
		return nil, err
	}

	//check if the bundle exsits locally
	var bundle meta.Bundle
	err = datasource.PlatformLoadOne(
		&bundle,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Fields: []wire.LoadRequestField{
				{
					ID: "uesio/studio.major",
				},
				{
					ID: "uesio/studio.minor",
				},
				{
					ID: "uesio/studio.patch",
				},
				{
					ID: "uesio/studio.app",
					Fields: []wire.LoadRequestField{
						{
							ID: commonfields.UniqueKey,
						},
					},
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: commonfields.UniqueKey,
					Value: strings.Join([]string{appID, major, minor, patch}, ":"),
				},
			},
		},
		session,
	)

	//we found it, create the new dependency
	if err == nil && bundle.ID != "" {
		newBundleDependency, err := meta.NewBundleDependency(appID, bundle.UniqueKey, workspace.UniqueKey)
		if err != nil {
			return nil, err
		}

		if err = datasource.PlatformSaveOne(newBundleDependency, nil, connection, session); err != nil {
			return nil, err
		}
		//Finish
		return nil, nil
	}

	bundleStoreDomain, err := configstore.GetValueFromKey("uesio/core.bundle_store_domain", session)
	if err != nil {
		return nil, err
	}

	newBundle, err := createBundle(appID, major, minor, patch, "")
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://studio.%s/site/bundles/v1/retrieve/%s/%s", bundleStoreDomain, appID, version)

	var payloadReader io.Reader
	httpReq, err := http.NewRequest(http.MethodGet, url, payloadReader)

	httpResp, err := httpClient.Get().Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	dest, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace: appID,
		Version:   newBundle.GetVersionString(),
		Context:   session.Context(),
	})
	if err != nil {
		return nil, err
	}

	// Read the zip file content
	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	// Create a zip reader from the zip file content
	zipReader, err := zip.NewReader(bytes.NewReader(body), int64(len(body)))
	if err != nil {
		return nil, err
	}

	// Iterate over the zip files
	for _, zipFile := range zipReader.File {
		rc, err := zipFile.Open()
		if err != nil {
			return nil, err
		}
		defer rc.Close()

		err = dest.StoreItem(zipFile.Name, rc)
		if err != nil {
			return nil, err
		}
	}

	//save the bundle and the dependency
	if err = datasource.PlatformSaveOne(newBundle, nil, connection, session); err != nil {
		return nil, err
	}

	newBundleDependency, err := meta.NewBundleDependency(appID, newBundle.UniqueKey, workspace.UniqueKey)
	if err != nil {
		return nil, err
	}

	if err = datasource.PlatformSaveOne(newBundleDependency, nil, connection, session); err != nil {
		return nil, err
	}

	return nil, nil

}

func createBundle(namespace, major, minor, patch, description string) (*meta.Bundle, error) {

	majorInt, err := strconv.Atoi(major)
	if err != nil {
		return nil, errors.New("Invalid version string")
	}

	minorInt, err := strconv.Atoi(minor)
	if err != nil {
		return nil, errors.New("Invalid version string")
	}

	patchInt, err := strconv.Atoi(patch)
	if err != nil {
		return nil, errors.New("Invalid version string")
	}

	newBundle, err := meta.NewBundle(namespace, majorInt, minorInt, patchInt, "")
	if err != nil {
		return nil, err
	}

	return newBundle, nil

}
