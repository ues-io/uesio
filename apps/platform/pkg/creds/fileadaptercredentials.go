package creds

import "crypto/md5"

// FileAdapterCredentials struct
type FileAdapterCredentials struct {
	Database string
	Username string
	Password string
}

// GetHash function
func (c *FileAdapterCredentials) GetHash() string {
	data := []byte(c.Database + ":" + c.Username + ":" + c.Password)
	sum := md5.Sum(data)
	return string(sum[:])
}
