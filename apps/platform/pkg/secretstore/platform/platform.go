package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// SecretStore struct
type SecretStore struct {
}

// Get function
func (ss *SecretStore) Get(key string) (string, error) {
	var s meta.SecretStoreValue
	err := datasource.PlatformLoadOne(&s, []adapt.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: key,
		},
	}, sess.GetHeadlessSession(&meta.User{
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, sess.GetHeadlessSite()))
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
	return datasource.PlatformSaveOne(&s, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, sess.GetHeadlessSession(&meta.User{
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, sess.GetHeadlessSite()))
}
