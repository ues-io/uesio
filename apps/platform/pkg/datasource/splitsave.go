package datasource

import (
	"errors"

	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type OpList struct {
	CollectionName string
	WireName       string
	Options        *adapt.SaveOptions
	List           []*adapt.SaveOp
	Counter        int
	CurrentIndex   int
	Errors         *[]adapt.SaveError
}

func (ol *OpList) getCurrentIndex() int {
	if ol.Counter == adapt.MAX_SAVE_BATCH_SIZE {
		ol.Counter = 0
		ol.CurrentIndex++
	}
	if ol.Counter == 0 {
		ol.List = append(ol.List, &adapt.SaveOp{
			CollectionName: ol.CollectionName,
			WireName:       ol.WireName,
			Inserts:        adapt.ChangeItems{},
			Updates:        adapt.ChangeItems{},
			Deletes:        adapt.ChangeItems{},
			Options:        ol.Options,
			Errors:         ol.Errors,
		})
	}
	ol.Counter++
	return ol.CurrentIndex
}

func (ol *OpList) addInsert(item loadable.Item, recordKey, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Inserts = append(ol.List[currentIndex].Inserts, &adapt.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
		IsNew:        true,
	})
}

func (ol *OpList) addUpdate(item loadable.Item, recordKey string, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Updates = append(ol.List[currentIndex].Updates, &adapt.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
	})
}

func (ol *OpList) addDelete(item loadable.Item, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Deletes = append(ol.List[currentIndex].Deletes, &adapt.ChangeItem{
		FieldChanges: item,
		IDValue:      idValue,
	})
}

func NewOpList(request *SaveRequest) *OpList {
	return &OpList{
		CollectionName: request.Collection,
		WireName:       request.Wire,
		Options:        request.Options,
		List:           []*adapt.SaveOp{},
		Errors:         &request.Errors,
	}
}

func splitSave(request *SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) ([]*adapt.SaveOp, error) {

	opList := NewOpList(request)

	if request.Changes != nil {
		err := request.Changes.Loop(func(item loadable.Item, recordKey string) error {
			idValue, err := item.GetField(adapt.ID_FIELD)
			if err != nil || idValue == nil || idValue.(string) == "" {
				newID := uuid.New().String()
				err := item.SetField(adapt.ID_FIELD, newID)
				if err != nil {
					return err
				}

				opList.addInsert(item, recordKey, newID)
			} else {
				opList.addUpdate(item, recordKey, idValue.(string))
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	if request.Deletes != nil {
		err := request.Deletes.Loop(func(item loadable.Item, _ string) error {
			idValue, err := item.GetField(adapt.ID_FIELD)
			if err != nil || idValue == nil || idValue.(string) == "" {
				return errors.New("bad id value for delete item")
			}
			opList.addDelete(item, idValue.(string))
			return nil
		})
		if err != nil {
			return nil, err
		}
	}

	return opList.List, nil
}
