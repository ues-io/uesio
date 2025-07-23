package auth

import "github.com/thecloudmasters/uesio/pkg/preload"

type UserResponse struct {
	// TODO: The CLI uses a subset of the properties in these types but we currently return the full User type payload. This
	// should be refactored to have a "base" and "full" version and only use the "full" version where needed to
	// improve performance, reduce payload size and not expose information that isn't needed to the respective client.
	// Also, the AuthCheck API uses this type and it's unlikely that any use of AuthCheck API would neeed all the data so this
	// too should be refactored.
	User *preload.UserMergeData `json:"user"`
}

type TokenResponse struct {
	UserResponse
	SessionID string `json:"sessionId"`
}

type LoginResponse struct {
	TokenResponse
	RedirectPath string `json:"redirectPath,omitempty"`
}

func NewUserResponse(user *preload.UserMergeData) *UserResponse {
	return &UserResponse{
		User: user,
	}
}

func NewTokenResponse(user *preload.UserMergeData, sessionID string) *TokenResponse {
	return &TokenResponse{
		UserResponse: UserResponse{
			User: user,
		},
		SessionID: sessionID,
	}
}

func NewLoginResponse(user *preload.UserMergeData, sessionID string, redirectPath string) *LoginResponse {
	return &LoginResponse{
		TokenResponse: TokenResponse{
			UserResponse: UserResponse{
				User: user,
			},
			SessionID: sessionID,
		},
		RedirectPath: redirectPath,
	}
}
