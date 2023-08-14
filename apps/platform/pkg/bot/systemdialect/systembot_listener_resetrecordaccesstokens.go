package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runResetRecordAccessTokensListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	collectionName, hasCollectionName := params["collection"]
	if !hasCollectionName {
		return nil, errors.New("must provide a collection to reset record tokens")
	}
	collectionNameString, ok := collectionName.(string)
	if !ok {
		return nil, errors.New("collection name must be a string")
	}
	err := datasource.ResetRecordTokens(collectionNameString, session)
	if err != nil {
		return nil, err
	}
	return nil, nil
}
