package oauth2

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func TestStateMarshaling(t *testing.T) {
	user := &meta.User{}
	ws := meta.Workspace{
		BuiltIn: meta.BuiltIn{
			UniqueKey: "luigi/foo:dev",
		},
	}
	site := &meta.Site{
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "luigi/foo",
			},
		},
	}
	otherSite := &meta.Site{
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "luigi/bar",
			},
		},
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
		IntegrationName: "foo",
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
			assert.Nil(t, err, "got non-nil err when marshalling: (%v, %v)", tt.name, tt.state)
			state, err := UnmarshalState(marshalled)
			assert.Nil(t, err, "got non-nil err when unmarshalling: (%v, %v)", tt.name, tt.state)
			assert.Equalf(t, tt.state, state, "StateMarshaling comparison(%v, %v)", tt.state, state)
			assert.Equalf(t, tt.expectHasWorkspace, state.HasWorkspaceContext(), "HasWorkspace(%v, %v)", tt.expectHasWorkspace, state.HasWorkspaceContext())
			assert.Equalf(t, tt.expectHasSiteAdmin, state.HasSiteAdminContext(), "HasSiteAdmin(%v, %v)", tt.expectHasSiteAdmin, state.HasSiteAdminContext())
		})
	}
}
