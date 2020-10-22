package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// UserCollection slice
type UserCollection []User

// GetName function
func (uc *UserCollection) GetName() string {
	return "users"
}

// GetFields function
func (uc *UserCollection) GetFields() []string {
	return []string{"id", "firstname", "lastname", "profile"}
}

// UnMarshal function
func (uc *UserCollection) UnMarshal(data []map[string]interface{}) error {
	return StandardDecoder(uc, data)
}

// Marshal function
func (uc *UserCollection) Marshal() ([]map[string]interface{}, error) {
	return StandardEncoder(uc)
}

// GetItem function
func (uc *UserCollection) GetItem(index int) CollectionableItem {
	actual := *uc
	return &actual[index]
}

// AuthClaimsRequest function
func (uc *UserCollection) AuthClaimsRequest(federationType, federationID, siteName string) []reqs.LoadRequest {
	return []reqs.LoadRequest{
		reqs.NewPlatformLoadRequest(
			"authWire",
			uc.GetName(),
			uc.GetFields(),
			[]reqs.LoadRequestCondition{
				{
					Field: "uesio.federationType",
					Value: federationType,
				},
				{
					Field: "uesio.federationId",
					Value: federationID,
				},
				{
					Field: "uesio.site",
					Value: siteName,
				},
			},
		),
	}
}
