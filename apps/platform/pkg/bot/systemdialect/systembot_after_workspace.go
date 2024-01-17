package systemdialect

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func deployWorkspaceFromBundle(workspaceID, bundleID string, connection wire.Connection, session *sess.Session) error {
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
		Context:      session.Context(),
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
	err = bs.GetBundleZip(buf, nil)
	if err != nil {
		return err
	}

	return deploy.DeployWithOptions(io.NopCloser(buf), workspaceSession, &deploy.DeployOptions{
		Connection: connection,
		Upsert:     true,
	})

}

func deployEmptyWorkspace(workspaceID string, connection wire.Connection, session *sess.Session) error {
	buf := new(bytes.Buffer)

	zipwriter := zip.NewWriter(buf)

	f, err := zipwriter.Create("bundle.yaml")
	if err != nil {
		return err
	}

	// Ensure that the default repository is populated
	defaultRepo := env.GetPrimaryDomain()
	defaultDef := &meta.BundleDef{
		Dependencies: map[string]meta.BundleDefDep{
			"uesio/builder": {
				Version:    "v0.0.1",
				Repository: defaultRepo,
			},
			"uesio/core": {
				Version:    "v0.0.1",
				Repository: defaultRepo,
			},
			"uesio/io": {
				Version:    "v0.0.1",
				Repository: defaultRepo,
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

	return deploy.DeployWithOptions(io.NopCloser(buf), workspaceSession, &deploy.DeployOptions{Connection: connection, Upsert: true})
}

func runWorkspaceAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	if err := request.LoopInserts(func(change *wire.ChangeItem) error {
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
	return request.LoopDeletes(func(change *wire.ChangeItem) error {
		workspaceUniqueKey, err := change.GetOldFieldAsString(commonfields.UniqueKey)
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
