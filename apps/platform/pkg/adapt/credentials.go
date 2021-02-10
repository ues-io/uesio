package adapt

import (
	"crypto/md5"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Credentials struct
type Credentials struct {
	Database string
	Username string
	Password string
	URL      string
	Region   string
}

// GetHash function
func (c *Credentials) GetHash() string {
	data := []byte(c.Database + ":" + c.Username + ":" + c.Password)
	sum := md5.Sum(data)
	return string(sum[:])
}

// GetCredentials function
func GetCredentials(ds *meta.DataSource, session *sess.Session) (*Credentials, error) {
	database, err := configstore.Merge(ds.Database, session)
	if err != nil {
		return nil, err
	}
	username, err := secretstore.GetSecretFromKey(ds.Username, session)
	if err != nil {
		return nil, err
	}
	url, err := configstore.Merge(ds.URL, session)
	if err != nil {
		return nil, err
	}
	region, err := configstore.Merge(ds.Region, session)
	if err != nil {
		return nil, err
	}
	password, err := secretstore.GetSecretFromKey(ds.Password, session)
	if err != nil {
		return nil, err
	}

	return &Credentials{
		Database: database,
		Username: username,
		Password: password,
		URL:      url,
		Region:   region,
	}, nil
}
