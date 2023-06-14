package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCreateBundleListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {

	appID := session.GetContextAppName()

	if appID == "" {
		return nil, errors.New("Error creating a new bundle, missing app")
	}

	if bundlestore.IsSystemBundle(appID) {
		return nil, errors.New("Error creating a new bundle, the providede app is a system app")
	}

	workspace := session.GetWorkspace()

	if workspace == nil {
		return nil, errors.New("Error creating a new bundle, missing workspace")
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

	wsbs, err := bundlestore.GetBundleStoreByType("workspace")
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"major":       major,
		"minor":       minor,
		"patch":       patch,
		"description": description,
	}, datasource.CreateBundle(appID, workspace.Name, bundle, wsbs, session)

}

// resolveBundleParameters determines the major/minor/patch and description for the new Bundle,
// using the following cascade in order of priority:
// 1. bot params (major/minor/patch MUST be all defined in order to qualify)
// 2. increment just patch using most recent bundle
// 3. default to 0.0.1
func resolveBundleParameters(params map[string]interface{}, lastBundle *meta.Bundle) (major, minor, patch int, description string) {
	description = ""

	if descriptionParam, hasDescriptionParam := params["description"]; hasDescriptionParam {
		if stringValue, isString := descriptionParam.(string); isString {
			description = stringValue
		}
	}
	major = 0
	minor = 0
	patch = 1

	// Prioritize params, but require major AND minor AND patch
	majorParam, hasValidMajorParam := GetMapKeyAsInt("major", params)
	minorParam, hasValidMinorParam := GetMapKeyAsInt("minor", params)
	patchParam, hasValidPatchParam := GetMapKeyAsInt("patch", params)

	if hasValidMajorParam && hasValidMinorParam && hasValidPatchParam {
		major = majorParam
		minor = minorParam
		patch = patchParam
	} else if lastBundle != nil {
		major = lastBundle.Major
		minor = lastBundle.Minor
		patch = lastBundle.Patch + 1
	}
	return major, minor, patch, description
}

func GetMapKeyAsInt(key string, m map[string]interface{}) (int, bool) {
	if value, ok := m[key]; ok {
		if intValue, isInt := value.(int); isInt {
			return intValue, true
		}
	}
	return 0, false
}
