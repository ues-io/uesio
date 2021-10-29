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
func (ffs *FeatureFlagStore) Get(key string) (*meta.FeatureFlagAssignment, error) {
	var ffa meta.FeatureFlagAssignment
	headlessSession, err := auth.GetHeadlessSession()
	if err != nil {
		return nil, err
	}
	err = datasource.PlatformLoadOne(&ffa, []adapt.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: key,
		},
	}, headlessSession)
	if err != nil {
		return nil, err
	}
	return &ffa, nil
}

// Set function
func (ffs *FeatureFlagStore) Set(key string, value bool, site string, user string) error {
	ffa := meta.FeatureFlagAssignment{
		Key:   key,
		Value: value,
		Site:  site,
		User:  user,
	}
	headlessSession, err := auth.GetHeadlessSession()
	if err != nil {
		return err
	}
	return datasource.PlatformSaveOne(&ffa, &adapt.SaveOptions{
		Upsert: &adapt.UpsertOptions{},
	}, headlessSession)
}
