package datasource

import (
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"testing"
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
				// New workspace should be identical to the original
				assert.Equal(t, s, sessWithWorkspaceContext)
				// Site should be unchanged
				assert.Equal(t, s.GetSite(), originalSite)
				// User should be unchanged
				assert.Equal(t, s.GetUserInfo(), originalUser)
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
				assert.Equal(t, s.GetUserInfo(), originalUser)
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
				// Site Admin should be set to a clone of the original site,
				// with elevated permissions
				assert.NotEqual(t, s.GetSiteAdmin(), originalSite)
				assert.True(t, s.GetSiteAdmin().Permissions.AllowAllViews)
				assert.True(t, s.GetSiteAdmin().Permissions.AllowAllRoutes)
				assert.True(t, s.GetSiteAdmin().Permissions.AllowAllFiles)
				assert.True(t, s.GetSiteAdmin().Permissions.AllowAllCollections)
				assert.True(t, s.GetSiteAdmin().Permissions.ModifyAllRecords)
				assert.True(t, s.GetSiteAdmin().Permissions.ViewAllRecords)
				// User should be a new object representation of the system user
				assert.Equal(t, s.GetUserInfo().UniqueKey, "system")
				assert.NotEqual(t, s.GetUserInfo(), originalUser)
			},
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			tt.assertions(t, GetSiteAdminSession(tt.input))
		})
	}
}
