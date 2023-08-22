package datasource

import (
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
		User: originalUser,
	}
	otherSite := &meta.Site{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "luigi/foo:prod",
		},
		User: originalUser,
	}
	sessWithWorkspaceContext := sess.NewSession(nil, originalUser, originalSite).AddWorkspaceContext(&ws)
	sessWithSiteAdminContext := sess.NewSession(nil, originalUser, originalSite).SetSiteAdmin(otherSite)
	plainSession := sess.NewSession(nil, originalUser, originalSite)
	tests := []struct {
		name       string
		input      *sess.Session
		assertions func(t *testing.T, s *sess.Session)
	}{
		{
			"return current session if we are in workspace context",
			sessWithWorkspaceContext,
			func(t *testing.T, s *sess.Session) {
				// A totally new session should have been created
				assert.NotEqual(t, s, sessWithWorkspaceContext)
				// Site should be unchanged
				assert.Equal(t, s.GetSite(), originalSite)

				assert.True(t, s.GetWorkspace() != nil)
				assert.True(t, s.GetSiteAdmin() == nil)

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
				assert.Equal(t, s.GetSiteAdmin(), otherSite)
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

				assert.True(t, s.GetWorkspace() == nil)
				assert.True(t, s.GetSiteAdmin() != nil)

				// Site Admin should be set to a clone of the original site,
				// with elevated permissions
				assert.NotEqual(t, s.GetSiteAdmin(), originalSite)
				assert.True(t, s.GetContextPermissions().AllowAllViews)
				assert.True(t, s.GetContextPermissions().AllowAllRoutes)
				assert.True(t, s.GetContextPermissions().AllowAllFiles)
				assert.True(t, s.GetContextPermissions().AllowAllCollections)
				assert.True(t, s.GetContextPermissions().ModifyAllRecords)
				assert.True(t, s.GetContextPermissions().ViewAllRecords)
				// User should be a new object representation of the system user
				assert.Equal(t, s.GetContextUser().UniqueKey, "system")
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
