package adapters

import (
	"crypto/md5"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
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
func GetCredentials(ds *metadata.DataSource, site *metadata.Site) (*Credentials, error) {
	database, err := configstore.Merge(ds.Database, site)
	if err != nil {
		return nil, err
	}
	username, err := secretstore.GetSecret(ds.Username, site)
	if err != nil {
		return nil, err
	}
	url, err := configstore.Merge(ds.URL, site)
	if err != nil {
		return nil, err
	}
	region, err := configstore.Merge(ds.Region, site)
	if err != nil {
		return nil, err
	}
	password, err := secretstore.GetSecret(ds.Password, site)
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
