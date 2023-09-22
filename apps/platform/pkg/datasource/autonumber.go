package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getAutonumber(insertCount int, connection adapt.Connection, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) (int, error) {
	autonumber, err := connection.GetAutonumber(collectionMetadata, session)
	if err != nil {
		return 0, fmt.Errorf("error getting next autonumber value from database: " + err.Error())
	}
	return autonumber + insertCount, nil
}
