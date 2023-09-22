package systemdialect

import (
	"errors"
	"io"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCreateBundleListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID := session.GetContextAppName()

	if appID == "" {
		return nil, errors.New("cannot create a bundle without an app in context")
	}

	if bundlestore.IsSystemBundle(appID) {
		return nil, errors.New("cannot create a bundle for a system app")
	}

	workspace := session.GetWorkspace()

	if workspace == nil {
		return nil, errors.New("cannot create a new bundle as a non-studio user")
	}

	if !session.GetSitePermissions().HasNamedPermission("uesio/studio.workspace_admin") {
		return nil, errors.New("you must be a workspace admin to create bundles")
	}

	var app meta.App
	err := datasource.PlatformLoadOne(
		&app,
		&datasource.PlatformLoadOptions{
			Connection: connection,
			Fields: []adapt.LoadRequestField{
				{
					ID: adapt.ID_FIELD,
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.UNIQUE_KEY_FIELD,
					Value: appID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return nil, err
	}

	var bundles meta.BundleCollection
	err = datasource.PlatformLoad(
		&bundles,
		&datasource.PlatformLoadOptions{
			Orders: []adapt.LoadRequestOrder{
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
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.app",
					Value: app.ID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
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

	err = datasource.PlatformSaveOne(bundle, nil, nil, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}

	source, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  appID,
		Version:    workspace.Name,
		Connection: connection,
		Workspace:  workspace,
	})
	if err != nil {
		return nil, err
	}

	dest, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace: appID,
		Version:   bundle.GetVersionString(),
	})
	if err != nil {
		return nil, err
	}

	creator := func(path string) (io.WriteCloser, error) {
		r, w := io.Pipe()
		go func() {
			dest.StoreItem(path, r)
			w.Close()
		}()
		return w, nil
	}

	err = retrieve.RetrieveBundle("", creator, source, session)
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
