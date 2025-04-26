package deploy

import (
	"bytes"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type VersionParts struct {
	Major int `bot:"major"`
	Minor int `bot:"minor"`
	Patch int `bot:"patch"`
}

type CreateBundleOptions struct {
	AppName       string        `bot:"appName"`
	WorkspaceName string        `bot:"workspaceName"`
	Version       *VersionParts `bot:"version"`
	ReleaseType   string        `bot:"releaseType"`
	Description   string        `bot:"description"`
}

func NewCreateBundleOptions(params map[string]any) (*CreateBundleOptions, error) {
	appName, err := param.GetRequiredString(params, "app")
	if err != nil {
		return nil, err
	}

	workspaceName, err := param.GetRequiredString(params, "workspaceName")
	if err != nil {
		return nil, err
	}

	description := param.GetOptionalString(params, "description", "")
	releaseType := param.GetOptionalString(params, "type", "")

	majorParam, hasValidMajorParam := param.GetAsInt(params, "major")
	minorParam, hasValidMinorParam := param.GetAsInt(params, "minor")
	patchParam, hasValidPatchParam := param.GetAsInt(params, "patch")

	// Require major AND minor AND patch to do a "custom" release
	hasValidParams := hasValidMajorParam && hasValidMinorParam && hasValidPatchParam

	var version *VersionParts

	if hasValidParams {
		version = &VersionParts{
			Major: majorParam,
			Minor: minorParam,
			Patch: patchParam,
		}
	}
	return &CreateBundleOptions{
		AppName:       appName,
		WorkspaceName: workspaceName,
		Version:       version,
		Description:   description,
		ReleaseType:   releaseType,
	}, nil
}

func CreateBundle(options *CreateBundleOptions, connection wire.Connection, session *sess.Session) (*meta.Bundle, error) {

	if options == nil {
		return nil, errors.New("invalid create options")
	}

	appName := options.AppName
	workspaceName := options.WorkspaceName

	if bundlestore.IsSystemBundle(appName) {
		return nil, exceptions.NewForbiddenException("cannot create a bundle for a system app")
	}

	if !session.GetSitePermissions().HasNamedPermission(constant.WorkspaceAdminPerm) {
		return nil, exceptions.NewForbiddenException("you must be a workspace admin to create bundles")
	}

	app, err := datasource.QueryAppForWrite(appName, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException("you do not have permission to create bundles for app " + appName)
	}

	workspace, err := datasource.QueryWorkspaceForWrite(appName+":"+workspaceName, commonfields.UniqueKey, session, connection)
	if err != nil {
		return nil, exceptions.NewForbiddenException("you do not have permission to create bundles for workspace " + workspaceName)
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

	major, minor, patch, description := resolveBundleParameters(options, lastBundle)

	bundle, err := meta.NewBundle(appName, major, minor, patch, description)
	if err != nil {
		return nil, err
	}

	source, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  appName,
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

	err = CreateBundleFromData(buf.Bytes(), bundle, connection, session)
	if err != nil {
		return nil, err
	}

	return bundle, nil

}

func CreateBundleFromData(data []byte, bundle *meta.Bundle, connection wire.Connection, session *sess.Session) error {

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
	}, connection, session, nil); err != nil {
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
func resolveBundleParameters(options *CreateBundleOptions, lastBundle *meta.Bundle) (major, minor, patch int, description string) {

	major = 0
	minor = 0
	patch = 1

	releaseType := options.ReleaseType
	description = options.Description
	hasValidParams := options.Version != nil

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
		major = options.Version.Major
		minor = options.Version.Minor
		patch = options.Version.Patch
	}
	return major, minor, patch, description
}
