package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func Rest(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	collectionNamespace := vars["namespace"]
	collectionName := vars["name"]

	fields := []wire.LoadRequestField{
		{
			ID: wire.ID_FIELD,
		},
	}

	queryFields, ok := r.URL.Query()["fields"]
	if ok {
		for _, fieldList := range queryFields {
			fieldArray := strings.Split(fieldList, ",")
			for _, field := range fieldArray {
				fields = append(fields, wire.LoadRequestField{
					ID: field,
				})
			}
		}
	}

	session := middleware.GetSession(r)

	op := &wire.LoadOp{
		WireName:       "RestWire",
		CollectionName: collectionNamespace + "." + collectionName,
		Collection:     &wire.Collection{},
		Fields:         fields,
		Query:          true,
	}

	_, err := datasource.Load([]*wire.LoadOp{op}, session, nil)
	if err != nil {
		HandleError(w, exceptions.NewBadRequestException("Load Failed: "+err.Error()))
		return
	}

	file.RespondJSON(w, r, op.Collection)

}
