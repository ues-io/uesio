package datasource

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func TestGetSiteAdminSession(t *testing.T) {
	originalUser := &meta.User{
		Username: "luigi",
	}
	ws := meta.Workspace{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "luigi/foo:dev",
		},
	}
	originalSite := &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/studio:prod",
		},
	}
	otherSite := &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "luigi/foo:prod",
		},
	}
	sessWithWorkspaceContext := sess.New(context.Background(), originalUser, originalSite).SetWorkspaceSession(sess.NewWorkspaceSession(
		&ws,
		originalUser,
		"uesio/some.profile",
		&meta.PermissionSet{},
	))
	sessWithSiteAdminContext := sess.New(context.Background(), originalUser, originalSite).SetSiteAdminSession(sess.NewSiteSession(otherSite, originalUser))
	plainSession := sess.New(context.Background(), originalUser, originalSite)
	tests := []struct {
		name       string
		input      *sess.Session
		assertions func(t *testing.T, s *sess.Session)
	}{
		{
			"return an upgraded session if we are in workspace context",
			sessWithWorkspaceContext,
			func(t *testing.T, s *sess.Session) {
				// A totally new session should have been created
				assert.NotEqual(t, s, sessWithWorkspaceContext)
				// Site should be unchanged
				assert.Equal(t, s.GetSite(), originalSite)

				assert.True(t, s.GetWorkspaceSession() != nil)
				assert.True(t, s.GetSiteAdminSession() == nil)

				assert.True(t, s.GetContextPermissions().AllowAllViews)
				assert.True(t, s.GetContextPermissions().AllowAllRoutes)
				assert.True(t, s.GetContextPermissions().AllowAllFiles)
				assert.True(t, s.GetContextPermissions().AllowAllCollections)
				assert.True(t, s.GetContextPermissions().ModifyAllRecords)
				assert.True(t, s.GetContextPermissions().ViewAllRecords)

				assert.Equal(t, s.GetContextUser().FirstName, originalUser.FirstName)
				assert.Equal(t, s.GetContextUser().LastName, originalUser.LastName)
				assert.Equal(t, s.GetContextUser().Profile, "uesio/system.admin")
			},
		},
		{
			"return current session if we are in site admin context",
			sessWithSiteAdminContext,
			func(t *testing.T, s *sess.Session) {
				// New session should be identical to the original
				assert.Equal(t, s, sessWithSiteAdminContext)
				// Site should be unchanged
				assert.Equal(t, s.GetSite(), originalSite)
				// Site Admin should be unchanged
				assert.Equal(t, s.GetSiteAdminSession().GetSite(), otherSite)
				// User should be unchanged
				assert.Equal(t, s.GetContextUser(), originalUser)
			},
		},
		{
			"upgrade the session to a site admin session",
			plainSession,
			func(t *testing.T, s *sess.Session) {
				// A totally new session should have been created
				assert.NotEqual(t, s, plainSession)
				// Site should be unchanged
				assert.Equal(t, s.GetSite(), originalSite)

				assert.True(t, s.GetWorkspaceSession() == nil)
				assert.True(t, s.GetSiteAdminSession() != nil)

				// Site Admin Session site should not change
				assert.Equal(t, s.GetSiteAdmin(), originalSite)
				assert.True(t, s.GetContextPermissions().AllowAllViews)
				assert.True(t, s.GetContextPermissions().AllowAllRoutes)
				assert.True(t, s.GetContextPermissions().AllowAllFiles)
				assert.True(t, s.GetContextPermissions().AllowAllCollections)
				assert.True(t, s.GetContextPermissions().ModifyAllRecords)
				assert.True(t, s.GetContextPermissions().ViewAllRecords)
				// User should be a new object representation of the system user
				assert.Equal(t, s.GetContextUser().UniqueKey, meta.SystemUsername)
				assert.NotEqual(t, s.GetContextUser(), originalUser)
			},
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			tt.assertions(t, GetSiteAdminSession(tt.input))
		})
	}
}
