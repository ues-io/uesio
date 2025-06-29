package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func GetCollectionMetadata(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	collectionName := vars["collectionname"]

	collections := datasource.MetadataRequest{
		Options: &datasource.MetadataRequestOptions{
			LoadAllFields: true,
		},
	}
	if err := collections.AddCollection(collectionName); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	metadataResponse := wire.MetadataCache{}
	if err := collections.Load(&metadataResponse, session, nil); err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("unable to load collection metadata", err))
		return
	}

	filejson.RespondJSON(w, r, &wire.LoadResponseBatch{
		Collections: metadataResponse.Collections,
	})

}
