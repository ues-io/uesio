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
	Token string `json:"token,omitempty"`
}

type LoginResponse struct {
	UserResponse
	RedirectPath string `json:"redirectPath,omitempty"`
}
