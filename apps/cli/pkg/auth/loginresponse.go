package auth

// This mirrors preload.UserMergeData but only contains the properties needed for CLI
type UserMergeData struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Profile   string `json:"profile"`
	Site      string `json:"site"`
	ID        string `json:"id"`
	Username  string `json:"username"`
	Language  string `json:"language"`
}

// This mirrors preload.LoginResponse but only contains the properties needed for CLI
type LoginResponse struct {
	SessionID string         `json:"sessionId"`
	User      *UserMergeData `json:"user"`
}
