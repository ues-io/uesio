package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func SplitSave(request *SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) (*adapt.ChangeItems, *adapt.ChangeItems, *adapt.ChangeItems, error) {

	inserts := adapt.ChangeItems{}
	updates := adapt.ChangeItems{}
	deletes := adapt.ChangeItems{}

	if request.Changes != nil {
		err := request.Changes.Loop(func(item loadable.Item, recordKey interface{}) error {
			changeItem := adapt.ChangeItem{
				FieldChanges: item,
				RecordKey:    recordKey,
			}
			idValue, err := item.GetField(collectionMetadata.IDField)
			if err != nil || idValue == nil || idValue.(string) == "" {
				inserts = append(inserts, changeItem)
			} else {
				changeItem.IDValue = idValue
				updates = append(updates, changeItem)
			}
			return nil
		})
		if err != nil {
			return nil, nil, nil, err
		}
	}

	if request.Deletes != nil {
		err := request.Deletes.Loop(func(item loadable.Item, _ interface{}) error {
			idValue, err := item.GetField(collectionMetadata.IDField)
			if err != nil || idValue == nil || idValue.(string) == "" {
				return errors.New("bad id value for delete item")
			}
			deletes = append(deletes, adapt.ChangeItem{
				FieldChanges: item,
				IDValue:      idValue,
			})
			return nil
		})
		if err != nil {
			return nil, nil, nil, err
		}
	}

	return &inserts, &updates, &deletes, nil
}
