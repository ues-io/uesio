package datasource

import (
	"errors"

	"github.com/gofrs/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type OpList struct {
	Request      *SaveRequest
	Metadata     *adapt.CollectionMetadata
	List         []*adapt.SaveOp
	Counter      int
	CurrentIndex int
}

func (ol *OpList) getCurrentIndex() int {
	if ol.Counter == adapt.MAX_SAVE_BATCH_SIZE {
		ol.Counter = 0
		ol.CurrentIndex++
	}
	if ol.Counter == 0 {
		ol.List = append(ol.List, &adapt.SaveOp{
			WireName: ol.Request.Wire,
			Inserts:  adapt.ChangeItems{},
			Updates:  adapt.ChangeItems{},
			Deletes:  adapt.ChangeItems{},
			Options:  ol.Request.Options,
			Errors:   &ol.Request.Errors,
			Metadata: ol.Metadata,
			Params:   ol.Request.Params,
		})
	}
	ol.Counter++
	return ol.CurrentIndex
}

func (ol *OpList) addInsert(item meta.Item, recordKey, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Inserts = append(ol.List[currentIndex].Inserts, &adapt.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
		IsNew:        true,
		Metadata:     ol.Metadata,
	})
}

func (ol *OpList) addUpdate(item meta.Item, recordKey string, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Updates = append(ol.List[currentIndex].Updates, &adapt.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
		Metadata:     ol.Metadata,
	})
}

func (ol *OpList) addDelete(item meta.Item, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Deletes = append(ol.List[currentIndex].Deletes, &adapt.ChangeItem{
		FieldChanges: item,
		IDValue:      idValue,
		Metadata:     ol.Metadata,
	})
}

func NewOpList(request *SaveRequest, collectionMetadata *adapt.CollectionMetadata) *OpList {
	return &OpList{
		Request:  request,
		Metadata: collectionMetadata,
		List:     []*adapt.SaveOp{},
	}
}

func splitSave(request *SaveRequest, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) ([]*adapt.SaveOp, error) {

	opList := NewOpList(request, collectionMetadata)

	if request.Changes != nil {
		err := request.Changes.Loop(func(item meta.Item, recordKey string) error {
			idValue, err := item.GetField(adapt.ID_FIELD)
			if err != nil || idValue == nil || idValue.(string) == "" {
				newID, err := uuid.NewV7()
				if err != nil {
					return err
				}
				newIDString := newID.String()
				err = item.SetField(adapt.ID_FIELD, newIDString)
				if err != nil {
					return err
				}

				opList.addInsert(item, recordKey, newIDString)
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
		err := request.Deletes.Loop(func(item meta.Item, _ string) error {
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
