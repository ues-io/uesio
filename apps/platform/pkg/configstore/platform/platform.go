package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// ConfigStore struct
type ConfigStore struct {
}

// Get function
func (cs *ConfigStore) Get(key string) (string, error) {
	var cv meta.ConfigStoreValue
	err := datasource.PlatformLoadOne(&cv, []adapt.LoadRequestCondition{
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
	return cv.Value, nil
}

// Set function
func (cs *ConfigStore) Set(key, value string) error {
	cv := meta.ConfigStoreValue{
		Key:   key,
		Value: value,
	}
	return datasource.PlatformSaveOne(&cv, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, sess.GetHeadlessSession(&meta.User{
		FirstName: "Guest",
		LastName:  "User",
		Profile:   "uesio.public",
	}, sess.GetHeadlessSite()))
}
