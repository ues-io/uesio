package systemdialect

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
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
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to create bundles for workspace %s", workspaceUniqueKey))
	}

	major, minor, patch, err := meta.ParseVersionStringToInt(version)
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
					Field: "uesio/studio.major",
					Value: major,
				},
				{
					Field: "uesio/studio.minor",
					Value: minor,
				},
				{
					Field: "uesio/studio.patch",
					Value: patch,
				},
				{
					Field: "uesio/studio.app->" + commonfields.UniqueKey,
					Value: appID,
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

	url := fmt.Sprintf("https://studio.%s/version/%s/%s/metadata/retrieve", bundleStoreDomain, appID, version)

	// var payloadReader io.Reader
	// httpReq, err := http.NewRequest(http.MethodGet, url, payloadReader)

	// httpResp, err := httpClient.Get().Do(httpReq)
	// if err != nil {
	// 	return nil, err
	// }

	//HERE we need to get our local bundle store and store the zip file we are retriving

	println(url)

	newBundle, err := meta.NewBundle(appID, major, minor, patch, "")
	if err != nil {
		return nil, err
	}

	if err = datasource.PlatformSaveOne(newBundle, nil, connection, session); err != nil {
		return nil, err
	}

	return nil, nil

}
