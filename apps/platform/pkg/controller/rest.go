package controller

import (
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
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
			ID: commonfields.Id,
		},
	}

	queryFields, ok := r.URL.Query()["fields"]
	if ok {
		for _, fieldList := range queryFields {
			fieldArray := strings.SplitSeq(fieldList, ",")
			for field := range fieldArray {
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

	err := datasource.LoadWithError(op, session, nil)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("Load Failed", err))
		return
	}

	filejson.RespondJSON(w, r, op.Collection)

}
