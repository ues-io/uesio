package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

// SecretStore struct
type SecretStore struct {
}

// Get function
func (ss *SecretStore) Get(key string) (string, error) {
	var s meta.SecretStoreValue
	session, err := auth.GetHeadlessSession()
	if err != nil {
		return "", err
	}
	err = datasource.PlatformLoadOne(
		&s,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio.id",
					Value: key,
				},
			},
		},
		session,
	)
	if err != nil {
		return "", nil
	}
	return s.Value, nil
}

// Set function
func (ss *SecretStore) Set(key, value string) error {
	s := meta.SecretStoreValue{
		Key:   key,
		Value: value,
	}
	session, err := auth.GetHeadlessSession()
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&s, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, nil, session)
}
