package metadata

import "github.com/thecloudmasters/uesio/pkg/reqs"

// SiteDomain struct
type SiteDomain struct {
	ID     string `uesio:"uesio.id"`
	Site   string `uesio:"uesio.site"`
	Type   string `uesio:"uesio.type"`
	Domain string `uesio:"uesio.domain"`
}

// GetCollectionName function
func (s *SiteDomain) GetCollectionName() string {
	return s.GetCollection().GetName()
}

// GetCollection function
func (s *SiteDomain) GetCollection() CollectionableGroup {
	var sdc SiteDomainCollection
	return &sdc
}

// GetConditions function
func (s *SiteDomain) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.domain",
			Value: s.Domain,
		},
	}, nil
}

// GetNamespace function
func (s *SiteDomain) GetNamespace() string {
	return ""
}

// SetNamespace function
func (s *SiteDomain) SetNamespace(namespace string) {
	//u.Namespace = namespace
}

// SetWorkspace function
func (s *SiteDomain) SetWorkspace(workspace string) {

}

// GetKey function
func (s *SiteDomain) GetKey() string {
	return s.ID
}
