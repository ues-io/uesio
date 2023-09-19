package systemdialect

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

func deployWorkspaceFromBundle(workspaceID, bundleID string, connection adapt.Connection, session *sess.Session) error {
	// Enter into a workspace context
	workspaceSession, err := datasource.AddWorkspaceContextByID(workspaceID, session, connection)
	if err != nil {
		return err
	}

	bundle := &meta.Bundle{}
	err = datasource.PlatformLoadByID(bundle, bundleID, session, connection)
	if err != nil {
		return err
	}

	bs, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:    workspaceSession.GetContextAppName(),
		Version:      bundle.GetVersionString(),
		Connection:   connection,
		Permissions:  meta.GetAdminPermissionSet(),
		AllowPrivate: true,
	})
	if err != nil {
		return err
	}
	// Retrieve the bundle zip
	// Create a new zip archive.
	buf := new(bytes.Buffer)
	zipwriter := zip.NewWriter(buf)
	create := retrieve.NewWriterCreator(zipwriter.Create)
	// Retrieve bundle contents
	err = retrieve.RetrieveBundle("", create, bs, session)
	if err != nil {
		return err
	}

	err = zipwriter.Close()
	if err != nil {
		return err
	}

	return deploy.DeployWithConnection(io.NopCloser(buf), workspaceSession, connection)

}

func deployEmptyWorkspace(workspaceID string, connection adapt.Connection, session *sess.Session) error {
	buf := new(bytes.Buffer)

	zipwriter := zip.NewWriter(buf)

	f, err := zipwriter.Create("bundle.yaml")
	if err != nil {
		return err
	}

	defaultDef := &meta.BundleDef{
		Dependencies: map[string]meta.BundleDefDep{
			"uesio/builder": {
				Version: "v0.0.1",
			},
			"uesio/core": {
				Version: "v0.0.1",
			},
			"uesio/io": {
				Version: "v0.0.1",
			},
		},
	}

	err = yaml.NewEncoder(f).Encode(defaultDef)
	if err != nil {
		return err
	}

	// Make sure to check the error on Close.
	err = zipwriter.Close()
	if err != nil {
		return err
	}

	// Enter into a workspace context
	workspaceSession, err := datasource.AddWorkspaceContextByID(workspaceID, session, connection)
	if err != nil {
		return err
	}

	return deploy.DeployWithConnection(io.NopCloser(buf), workspaceSession, connection)
}

func runWorkspaceAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	if err := request.LoopInserts(func(change *adapt.ChangeItem) error {
		workspaceID := change.IDValue
		sourceBundleID, _ := change.GetReferenceKey("uesio/studio.sourcebundle")
		if sourceBundleID == "" {
			return deployEmptyWorkspace(workspaceID, connection, session)
		}
		return deployWorkspaceFromBundle(workspaceID, sourceBundleID, connection, session)
	}); err != nil {
		return err
	}

	// If we are deleting workspaces, also truncate their data
	return request.LoopDeletes(func(change *adapt.ChangeItem) error {
		workspaceUniqueKey, err := change.GetOldFieldAsString(adapt.UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}
		if workspaceUniqueKey == "" {
			return errors.New("unable to get workspace unique key, cannot truncate data")
		}
		if err = connection.TruncateTenantData(sess.MakeWorkspaceTenantID(workspaceUniqueKey)); err != nil {
			return errors.New("unable to truncate workspace data: " + err.Error())
		}
		return nil
	})
}
