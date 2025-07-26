package datasource

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
	"github.com/thecloudmasters/uesio/pkg/types/workspace"
)

func sessWithPerms(site *meta.Site, perms *meta.PermissionSet) *sess.Session {
	return sess.New(&meta.User{
		Username:    "luigi",
		Permissions: perms,
	}, site)
}

func TestRequestWorkspaceWriteAccess(t *testing.T) {

	app := &meta.App{
		Name:     "foo",
		FullName: "luigi/foo",
		BuiltIn: meta.BuiltIn{
			UniqueKey: "luigi/foo",
		},
	}
	studioApp := &meta.App{
		Name:     "studio",
		FullName: "uesio/studio",
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/studio",
		},
	}
	ws := &meta.Workspace{
		Name: "dev",
		App:  app,
		BuiltIn: meta.BuiltIn{
			ID:        "1234",
			UniqueKey: "luigi/foo:dev",
		},
	}

	mockQuery := func(queryValue, queryField string, session *sess.Session, connection wire.Connection) (*meta.Workspace, error) {
		return nil, errors.New("query not expected")
	}

	var testInstance *testing.T

	wsAdminPerms := &meta.PermissionSet{NamedRefs: map[string]bool{
		constant.WorkspaceAdminPerm: true,
	}}
	wsAdminPermsWithWorkspaceIdWritePerm := &meta.PermissionSet{NamedRefs: map[string]bool{
		constant.WorkspaceAdminPerm:      true,
		getWorkspaceWritePermName(ws.ID): true,
	}}
	studioSuperAdminPerms := &meta.PermissionSet{NamedRefs: map[string]bool{
		constant.WorkspaceAdminPerm: true,
	}, ModifyAllRecords: true}
	otherSite := &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "luigi/foo:staging",
		},
		App: app,
	}
	studioSite := &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/studio:prod",
		},
		App: studioApp,
	}

	tests := []struct {
		name            string
		session         *sess.Session
		params          map[string]any
		expectHasAccess bool
		expectErr       string
		expectKeyInfo   workspace.KeyInfo
		mockWSQuery     QueryWorkspaceForWriteFn
	}{
		{
			name:            "no access if not in Studio site",
			session:         sessWithPerms(otherSite, &meta.PermissionSet{}),
			params:          map[string]any{},
			expectHasAccess: false,
			expectErr:       "this site does not allow working with workspaces",
		},
		{
			name:            "no access if not workspace admin",
			session:         sessWithPerms(studioSite, &meta.PermissionSet{}),
			params:          map[string]any{},
			expectHasAccess: false,
			expectErr:       "your profile does not allow you to edit workspace metadata",
		},
		{
			name:    "grant access if Session already has named perm",
			session: sessWithPerms(studioSite, wsAdminPermsWithWorkspaceIdWritePerm),
			params: map[string]any{
				"workspaceid":   ws.ID,
				"workspacename": ws.Name,
				"app":           app.FullName,
			},
			expectHasAccess: true,
			expectKeyInfo:   workspace.NewKeyInfo(app.FullName, ws.Name, ws.ID),
		},
		{
			name:    "grant access if Session is Studio super-admin",
			session: sessWithPerms(studioSite, studioSuperAdminPerms),
			params: map[string]any{
				"workspaceid":   ws.ID,
				"workspacename": ws.Name,
				"app":           app.FullName,
			},
			expectHasAccess: true,
			expectKeyInfo:   workspace.NewKeyInfo(app.FullName, ws.Name, ws.ID),
		},
		{
			name:    "it should query the database to check if user has workspace write access",
			session: sessWithPerms(studioSite, wsAdminPerms),
			params: map[string]any{
				"workspacename": ws.Name,
				"app":           app.FullName,
			},
			mockWSQuery: func(queryValue, queryField string, session *sess.Session, connection wire.Connection) (*meta.Workspace, error) {
				assert.Equal(testInstance, queryValue, ws.UniqueKey)
				assert.Equal(testInstance, queryField, commonfields.UniqueKey)
				return ws, nil
			},
			expectHasAccess: true,
			expectKeyInfo:   workspace.NewKeyInfo(app.FullName, ws.Name, ws.ID),
		},
		{
			name:    "it should query the database to check if user has workspace write access (no access scenario)",
			session: sessWithPerms(studioSite, wsAdminPerms),
			params: map[string]any{
				"workspaceid": ws.ID,
			},
			mockWSQuery: func(queryValue, queryField string, session *sess.Session, connection wire.Connection) (*meta.Workspace, error) {
				assert.Equal(testInstance, queryValue, ws.ID)
				assert.Equal(testInstance, queryField, commonfields.Id)
				return nil, errors.New("no access to this workspace")
			},
			expectHasAccess: false,
			expectErr:       "no access to this workspace",
			expectKeyInfo:   workspace.NewKeyInfo(app.FullName, ws.Name, ws.ID),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.mockWSQuery != nil {
				setQueryWorkspaceForWriteFn(tt.mockWSQuery)
			} else {
				setQueryWorkspaceForWriteFn(mockQuery)
			}
			testInstance = t
			actual := RequestWorkspaceWriteAccess(tt.params, nil, tt.session)
			assert.Equal(t, tt.expectHasAccess, actual.HasWriteAccess())
			if tt.expectErr != "" {
				assert.Equal(t, tt.expectErr, actual.Error().Error())
			} else {
				assert.Nil(t, actual.Error())
			}
			assert.Equal(t, tt.expectKeyInfo.GetWorkspaceName(), actual.GetWorkspaceName())
			assert.Equal(t, tt.expectKeyInfo.GetWorkspaceID(), actual.GetWorkspaceID())
			assert.Equal(t, tt.expectKeyInfo.GetAppName(), actual.GetAppName())
		})
	}
}
