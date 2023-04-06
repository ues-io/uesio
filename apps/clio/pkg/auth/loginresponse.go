package auth

type UserMergeData struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Profile   string `json:"profile"`
	Site      string `json:"site"`
	ID        string `json:"id"`
	Username  string `json:"username"`
	Language  string `json:"language"`
}

type LoginResponse struct {
	User *UserMergeData `json:"user"`
}
