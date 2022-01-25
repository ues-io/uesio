package salesforce

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Migrate function
func (a *Adapter) Migrate(credentials *adapt.Credentials) error {
	fmt.Println("Migrating Salesforce")
	return nil
}
