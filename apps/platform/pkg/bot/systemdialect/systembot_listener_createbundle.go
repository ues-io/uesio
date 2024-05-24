package systemdialect

import (
	"bytes"
	"fmt"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCreateBundleListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID, err := getRequiredParameter(params, "app")
	if err != nil {
		return nil, err
	}

	workspaceName, err := getRequiredParameter(params, "workspaceName")
	if err != nil {
		return nil, err
	}

	if bundlestore.IsSystemBundle(appID) {
		return nil, exceptions.NewForbiddenException("cannot create a bundle for a system app")
	}

	if !session.GetSitePermissions().HasNamedPermission(constant.WorkspaceAdminPerm) {
		return nil, exceptions.NewForbiddenException("you must be a workspace admin to create bundles")
	}

	app, err := datasource.QueryAppForWrite(appID, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to create bundles for app %s", appID))
	}

	workspace, err := datasource.QueryWorkspaceForWrite(appID+":"+workspaceName, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException(fmt.Sprintf("you do not have permission to create bundles for workspace %s", workspaceName))
	}

	var bundles meta.BundleCollection
	if err = datasource.PlatformLoad(
		&bundles,
		&datasource.PlatformLoadOptions{
			BatchSize: 1,
			Orders: []wire.LoadRequestOrder{
				{
					Field: "uesio/studio.major",
					Desc:  true,
				},
				{
					Field: "uesio/studio.minor",
					Desc:  true,
				},
				{
					Field: "uesio/studio.patch",
					Desc:  true,
				},
			},
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/studio.app",
					Value: app.ID,
				},
			},
		},
		session,
	); err != nil {
		return nil, err
	}

	var lastBundle *meta.Bundle

	if len(bundles) != 0 {
		lastBundle = bundles[0]
	}

	major, minor, patch, description := resolveBundleParameters(params, lastBundle)

	bundle, err := meta.NewBundle(appID, major, minor, patch, description)
	if err != nil {
		return nil, err
	}

	source, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  appID,
		Version:    workspace.Name,
		Connection: connection,
		Workspace:  workspace,
		Context:    session.Context(),
	})
	if err != nil {
		return nil, err
	}

	// Also upload the entire bundle as a ZIP file attached as a user file,
	// so that we can easily download everything when needed rather than having to get the individual bundle files.
	buf := new(bytes.Buffer)

	err = source.GetBundleZip(buf, nil)
	if err != nil {
		return nil, err
	}

	err = createNewBundle(buf.Bytes(), bundle, params, connection, session)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"major":       major,
		"minor":       minor,
		"patch":       patch,
		"description": description,
	}, nil

}

func createNewBundle(data []byte, bundle *meta.Bundle, params map[string]interface{}, connection wire.Connection, session *sess.Session) error {

	if err := datasource.PlatformSaveOne(bundle, nil, connection, session); err != nil {
		return err
	}

	dest, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace: bundle.App.UniqueKey,
		Version:   bundle.GetVersionString(),
		Context:   session.Context(),
	})
	if err != nil {
		return err
	}

	err = dest.SetBundleZip(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return err
	}

	if _, err = filesource.Upload([]*filesource.FileUploadOp{
		{
			Data:         bytes.NewReader(data),
			Path:         bundle.GetVersionString() + ".zip",
			CollectionID: "uesio/studio.bundle",
			RecordID:     bundle.ID,
			FieldID:      "uesio/studio.contents",
		},
	}, connection, session, params); err != nil {
		return err
	}

	return nil

}

// resolveBundleParameters determines the major/minor/patch and description for the new Bundle,
// using the following cascade in order of priority:
// 1. bot params - using release type, and the most recent bundle
// 2. bot params - manual, using major/minor/patch, which MUST be all defined in order to qualify)
// 3. default to just doing a patch with the most recent bundle, if there is one
// 4. if NO recent bundle / all else fails --- start with 0.0.1
func resolveBundleParameters(params map[string]interface{}, lastBundle *meta.Bundle) (major, minor, patch int, description string) {
	description = ""

	releaseType := ""

	if releaseTypeParam, hasReleaseTypeParam := params["type"]; hasReleaseTypeParam {
		if stringValue, isString := releaseTypeParam.(string); isString {
			releaseType = stringValue
		}
	}

	if descriptionParam, hasDescriptionParam := params["description"]; hasDescriptionParam {
		if stringValue, isString := descriptionParam.(string); isString {
			description = stringValue
		}
	}

	majorParam, hasValidMajorParam := GetMapKeyAsInt("major", params)
	minorParam, hasValidMinorParam := GetMapKeyAsInt("minor", params)
	patchParam, hasValidPatchParam := GetMapKeyAsInt("patch", params)

	major = 0
	minor = 0
	patch = 1

	// Require major AND minor AND patch to do a "custom" release
	hasValidParams := hasValidMajorParam && hasValidMinorParam && hasValidPatchParam

	// If we have a valid release type, and we have a recent bundle,
	// then just increment the corresponding numbers on that bundle.
	// Also, default to a patch release if we don't have valid release numbers.
	if lastBundle != nil && (releaseType == "major" || releaseType == "minor" || releaseType == "patch" || (releaseType == "" && !hasValidParams)) {
		switch releaseType {
		case "major":
			major = lastBundle.Major + 1
			minor = 0
			patch = 0
		case "minor":
			major = lastBundle.Major
			minor = lastBundle.Minor + 1
			patch = 0
		default:
			major = lastBundle.Major
			minor = lastBundle.Minor
			patch = lastBundle.Patch + 1
		}
	} else if hasValidParams {
		major = majorParam
		minor = minorParam
		patch = patchParam
	}
	return major, minor, patch, description
}

func GetMapKeyAsInt(key string, m map[string]interface{}) (int, bool) {
	if value, ok := m[key]; ok {
		if intValue, isInt := value.(int); isInt {
			return intValue, true
		}
		if floatValue, isFloat := value.(float64); isFloat {
			return int(floatValue), true
		}
		if stringValue, isString := value.(string); isString {
			intValue, err := strconv.Atoi(stringValue)
			if err != nil {
				return 0, false
			}
			return intValue, true
		}
	}
	return 0, false
}
