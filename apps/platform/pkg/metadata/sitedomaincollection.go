package metadata

// SiteDomainCollection slice
type SiteDomainCollection []SiteDomain

// GetName function
func (s *SiteDomainCollection) GetName() string {
	return "sites"
}
