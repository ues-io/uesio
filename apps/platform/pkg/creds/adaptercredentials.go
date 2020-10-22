package creds

import (
	"crypto/md5"
)

// AdapterCredentials struct
type AdapterCredentials struct {
	Database string
	Username string
	Password string
	URL      string
	Region   string
}

// GetHash function
func (c *AdapterCredentials) GetHash() string {
	data := []byte(c.Database + ":" + c.Username + ":" + c.Password)
	sum := md5.Sum(data)
	return string(sum[:])
}
