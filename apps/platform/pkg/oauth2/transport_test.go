package oauth2

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

func TestTransport_setAuthHeader(t1 *testing.T) {
	type args struct {
		token            *oauth2.Token
		defaultTokenType string
	}
	tests := []struct {
		name              string
		args              args
		expectAuthHeader  string
		expectAccessToken string
	}{
		{
			"it should populate bearer token auth in the request if token type is not set",
			args{
				token: &oauth2.Token{
					AccessToken: "123",
				},
			},
			"Bearer 123",
			"123",
		},
		{
			"it should populate bearer token auth in the request if token type is set to bearer, over default",
			args{
				token: &oauth2.Token{
					AccessToken: "123",
					TokenType:   "bearer",
				},
				defaultTokenType: "none",
			},
			"Bearer 123",
			"123",
		},
		{
			"it should populate bearer token auth in the request if token type default is bearer",
			args{
				token: &oauth2.Token{
					AccessToken: "123",
				},
				defaultTokenType: "bearer",
			},
			"Bearer 123",
			"123",
		},
		{
			"it should populate plain token in auth header if token type default is none",
			args{
				token: &oauth2.Token{
					AccessToken: "123",
				},
				defaultTokenType: "none",
			},
			"123",
			"123",
		},
	}
	for _, tt := range tests {
		t1.Run(tt.name, func(t1 *testing.T) {
			// dummy request
			r, _ := http.NewRequest(http.MethodGet, "https://localhost:8080", nil)
			invoked := false
			onAuthHeaderSet := func(token *oauth2.Token, authHeader string) {
				invoked = true
				assert.Equal(t1, tt.expectAuthHeader, r.Header.Get("Authorization"))
				assert.Equal(t1, tt.expectAccessToken, token.AccessToken)
			}
			t := &Transport{
				ClientOptions: &ClientOptions{
					OnAuthHeaderSet:  onAuthHeaderSet,
					DefaultTokenType: tt.args.defaultTokenType,
				},
			}
			t.setAuthHeader(r, tt.args.token)
			assert.True(t1, invoked)
			assert.Equal(t1, tt.expectAuthHeader, r.Header.Get("Authorization"))
		})
	}
}
