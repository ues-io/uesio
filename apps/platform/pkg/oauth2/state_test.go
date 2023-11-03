package oauth2

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func TestStateMarshaling(t *testing.T) {
	user := &meta.User{
		Username: "uesio",
	}
	ws := meta.Workspace{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "uesio/tests:dev",
		},
		Name: "dev",
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "uesio/tests",
			},
		},
	}
	site := &meta.Site{
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "luigi/foo",
			},
		},
		Name: "prod",
	}
	otherSite := &meta.Site{
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "luigi/bar",
			},
		},
		Name: "prod",
	}
	sessWithWorkspaceContext := sess.New("", user, site).SetWorkspaceSession(sess.NewWorkspaceSession(
		&ws,
		user,
		"",
		nil,
	))
	sessWithSiteAdminContext := sess.New("", user, site).SetSiteAdminSession(sess.NewSiteSession(otherSite, user))
	plainSession := sess.New("", user, site)

	stateWithWorkspace := (&State{
		Nonce:           "123",
		IntegrationName: "uesio/tests.oauth2_authorization_code_1",
	}).WithContext(sessWithWorkspaceContext)
	stateWithSiteAdmin := (&State{
		Nonce:           "456",
		IntegrationName: "boo",
	}).WithContext(sessWithSiteAdminContext)
	plainState := (&State{
		Nonce:           "456",
		IntegrationName: "boo",
	}).WithContext(plainSession)

	tests := []struct {
		name               string
		state              *State
		expectHasWorkspace bool
		expectHasSiteAdmin bool
	}{
		{
			"no context",
			plainState,
			false,
			false,
		},
		{
			"workspace context",
			stateWithWorkspace,
			true,
			false,
		},
		{
			"site admin context",
			stateWithSiteAdmin,
			false,
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			marshalled, err := tt.state.Marshal()
			//fmt.Println("marshalled state for integration: " + tt.state.IntegrationName + ", state=" + marshalled)
			assert.Nil(t, err, "got non-nil err when marshalling: (%v, %v)", tt.name, tt.state)
			state, err := UnmarshalState(marshalled)
			assert.Nil(t, err, "got non-nil err when unmarshalling: (%v, %v)", tt.name, tt.state)
			assert.Equalf(t, tt.state, state, "StateMarshaling comparison(%v, %v)", tt.state, state)
			assert.Equalf(t, tt.expectHasWorkspace, state.HasWorkspaceContext(), "HasWorkspace(%v, %v)", tt.expectHasWorkspace, state.HasWorkspaceContext())
			if tt.expectHasWorkspace {
				assert.Equalf(t, tt.state.WorkspaceName, state.WorkspaceName, "check workspace properties: WorkspaceName")
				assert.Equalf(t, tt.state.AppName, state.AppName, "check workspace properties: AppName")
			}
			assert.Equalf(t, tt.expectHasSiteAdmin, state.HasSiteAdminContext(), "HasSiteAdmin(%v, %v)", tt.expectHasSiteAdmin, state.HasSiteAdminContext())
			if tt.expectHasSiteAdmin {
				assert.Equalf(t, tt.state.SiteName, state.SiteName, "check SiteAdmin context properties: SiteName")
				assert.Equalf(t, tt.state.AppName, state.AppName, "check SiteAdmin context properties: AppName")
			}
		})
	}
}
