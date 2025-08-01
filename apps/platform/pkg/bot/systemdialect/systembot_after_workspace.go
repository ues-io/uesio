package systemdialect

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func deployWorkspaceFromBundle(ctx context.Context, workspaceID, bundleID string, connection wire.Connection, session *sess.Session) error {
	// Enter into a workspace context
	workspaceSession, err := datasource.AddWorkspaceContextByID(ctx, workspaceID, session, connection)
	if err != nil {
		return err
	}

	bundle := &meta.Bundle{}
	err = datasource.PlatformLoadByID(ctx, bundle, bundleID, session, connection)
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
	err = bs.GetBundleZip(ctx, buf, nil)
	if err != nil {
		return err
	}

	return deploy.DeployWithOptions(ctx, io.NopCloser(buf), workspaceSession, &deploy.DeployOptions{
		Connection: connection,
		Upsert:     true,
		Prefix:     retrieve.BundleDirectory,
	})

}

func deployEmptyWorkspace(ctx context.Context, workspaceID string, connection wire.Connection, session *sess.Session) error {
	buf := new(bytes.Buffer)

	zipwriter := zip.NewWriter(buf)

	f, err := zipwriter.Create("bundle.yaml")
	if err != nil {
		return err
	}

	defaultDef := &meta.BundleDef{
		Dependencies: map[string]meta.BundleDefDep{
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
	workspaceSession, err := datasource.AddWorkspaceContextByID(ctx, workspaceID, session, connection)
	if err != nil {
		return err
	}

	return deploy.DeployWithOptions(ctx, io.NopCloser(buf), workspaceSession, &deploy.DeployOptions{Connection: connection, Upsert: true})
}

func runWorkspaceAfterSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	if err := request.LoopInserts(func(change *wire.ChangeItem) error {
		workspaceID := change.IDValue
		sourceBundleID, _ := change.GetReferenceKey("uesio/studio.sourcebundle")
		if sourceBundleID == "" {
			return deployEmptyWorkspace(ctx, workspaceID, connection, session)
		}
		return deployWorkspaceFromBundle(ctx, workspaceID, sourceBundleID, connection, session)
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
		if err = connection.TruncateTenantData(ctx, sess.MakeWorkspaceTenantID(workspaceUniqueKey)); err != nil {
			return fmt.Errorf("unable to truncate workspace data: %w", err)
		}
		return nil
	})
}
