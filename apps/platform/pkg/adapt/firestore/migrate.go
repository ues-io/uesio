package firestore

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {
	fmt.Println("Migrating Firestore")
	return nil
}
