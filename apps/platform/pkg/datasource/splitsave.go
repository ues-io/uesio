package datasource

import (
	"errors"

	"github.com/gofrs/uuid"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type OpList struct {
	Request      *SaveRequest
	Metadata     *wire.CollectionMetadata
	List         []*wire.SaveOp
	Counter      int
	CurrentIndex int
}

func (ol *OpList) getCurrentIndex() int {
	if ol.Counter == adapt.MAX_SAVE_BATCH_SIZE {
		ol.Counter = 0
		ol.CurrentIndex++
	}
	if ol.Counter == 0 {
		ol.List = append(ol.List, &wire.SaveOp{
			CollectionName: ol.Request.Collection,
			WireName:       ol.Request.Wire,
			Inserts:        wire.ChangeItems{},
			Updates:        wire.ChangeItems{},
			Deletes:        wire.ChangeItems{},
			Options:        ol.Request.Options,
			Errors:         &ol.Request.Errors,
			Params:         ol.Request.Params,
		})
	}
	ol.Counter++
	return ol.CurrentIndex
}

func (ol *OpList) addInsert(item meta.Item, recordKey, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Inserts = append(ol.List[currentIndex].Inserts, &wire.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
		IsNew:        true,
		Metadata:     ol.Metadata,
	})
}

func (ol *OpList) addUpdate(item meta.Item, recordKey string, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Updates = append(ol.List[currentIndex].Updates, &wire.ChangeItem{
		IDValue:      idValue,
		FieldChanges: item,
		RecordKey:    recordKey,
		Metadata:     ol.Metadata,
	})
}

func (ol *OpList) addDelete(item meta.Item, idValue string) {
	currentIndex := ol.getCurrentIndex()
	ol.List[currentIndex].Deletes = append(ol.List[currentIndex].Deletes, &wire.ChangeItem{
		FieldChanges: item,
		IDValue:      idValue,
		Metadata:     ol.Metadata,
	})
}

func NewOpList(request *SaveRequest, collectionMetadata *wire.CollectionMetadata) *OpList {
	return &OpList{
		Request:  request,
		Metadata: collectionMetadata,
		List:     []*wire.SaveOp{},
	}
}

func splitSave(request *SaveRequest, collectionMetadata *wire.CollectionMetadata) ([]*wire.SaveOp, error) {

	opList := NewOpList(request, collectionMetadata)

	if request.Changes != nil {
		err := request.Changes.Loop(func(item meta.Item, recordKey string) error {
			idValue, err := item.GetField(commonfields.Id)
			if err != nil || idValue == nil || idValue.(string) == "" {
				newID, err := uuid.NewV7()
				if err != nil {
					return err
				}
				newIDString := newID.String()
				err = item.SetField(commonfields.Id, newIDString)
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
			idValue, err := item.GetField(commonfields.Id)
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
