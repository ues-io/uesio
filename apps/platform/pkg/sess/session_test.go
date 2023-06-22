package sess

import (
	"github.com/icza/session"
	"testing"
)

func TestSession_GetSessionIdHash(t *testing.T) {

	happyBrowserSession := session.NewSession()

	tests := []struct {
		name             string
		session          Session
		hasSessionIdHash bool
	}{
		{
			"no browser session - should return empty",
			Session{},
			false,
		},
		{
			"nil browser session",
			Session{
				browserSession: nil,
			},
			false,
		},
		{
			"happy path - browser session with id",
			Session{
				browserSession: &happyBrowserSession,
			},
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.session.GetSessionIdHash()
			if tt.hasSessionIdHash == true {
				if got == "" {
					t.Errorf("GetSessionIdHash() did not return a hash as expected")
				}
			} else if got != "" {
				t.Errorf("GetSessionIdHash() returned a value when it was not expected")
			}
		})
	}
}
