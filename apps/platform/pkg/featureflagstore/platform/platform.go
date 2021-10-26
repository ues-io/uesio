package environment

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

// FeatureFlagStore struct
type FeatureFlagStore struct {
}

// Get function
func (ffs *FeatureFlagStore) Get(key string) (string, error) {
	var ffa meta.FeatureFlagAssignment
	headlessSession, err := auth.GetHeadlessSession()
	if err != nil {
		return "", err
	}
	err = datasource.PlatformLoadOne(&ffa, []adapt.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: key,
		},
	}, headlessSession)
	if err != nil {
		return "", nil
	}
	return ffa.Value, nil
}

// Set function
func (ffs *FeatureFlagStore) Set(key, value string) error {
	ffa := meta.FeatureFlagAssignment{
		Key:   key,
		Value: value,
	}
	headlessSession, err := auth.GetHeadlessSession()
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&ffa, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, headlessSession)
}
