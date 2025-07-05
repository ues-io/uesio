package file

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func processUploadRequest(r *http.Request) (*meta.UserFileMetadata, error) {
	parts, err := r.MultipartReader()
	if err != nil {
		return nil, err
	}

	session := middleware.GetSession(r)

	op := &filesource.FileUploadOp{}

	var result *meta.UserFileMetadata

	for {
		part, err_part := parts.NextPart()
		if err_part == io.EOF {
			break
		}
		if part.FormName() == "details" {
			err := json.NewDecoder(part).Decode(op)
			if err != nil {
				return nil, err
			}
		}
		if part.FormName() == "file" {
			if op.Path == "" {
				return nil, errors.New("no name specified")
			}
			if op.CollectionID == "" {
				return nil, errors.New("no collectionid specified")
			}
			if op.RecordID == "" {
				return nil, errors.New("no recordid specified")
			}
			op.Data = part
			results, err := filesource.Upload([]*filesource.FileUploadOp{op}, nil, session, op.Params)
			if err != nil {
				return nil, err
			}
			if len(results) != 1 {
				return nil, errors.New("upload failed: invalid response")
			}
			result = results[0]
		}
	}
	return result, nil

}

func UploadUserFile(w http.ResponseWriter, r *http.Request) {
	if result, err := processUploadRequest(r); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
	} else {
		filejson.RespondJSON(w, r, result)
	}
}

// DeleteUserFile deletes the requested user file
func DeleteUserFile(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	if err := filesource.Delete(mux.Vars(r)["fileid"], session); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
	} else {
		filejson.RespondJSON(w, r, &bot.BotResponse{
			Success: true,
		})
	}
}

func DownloadUserFile(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	query := r.URL.Query()
	userFileID := query.Get("userfileid")
	version := query.Get("version")
	if userFileID == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("missing required query parameter: userfileid", nil))
		return
	}
	rs, userFile, err := filesource.Download(userFileID, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	defer rs.Close()

	if version != "" {
		middleware.Set1YearCache(w)
	} else {
		middleware.SetNoCache(w)
	}

	respondFile(w, r, userFile.Path(), userFile.LastModified(), rs)
}

func DownloadAttachment(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	vars := mux.Vars(r)
	recordID := vars["recordid"]
	path := vars["path"]
	version := vars["version"]
	if recordID == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("missing required attachment recordid", nil))
		return
	}
	if path == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("missing required attachment path", nil))
		return
	}

	rs, userFile, err := filesource.DownloadAttachment(recordID, path, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	defer rs.Close()

	if version != "" {
		middleware.Set1YearCache(w)
	} else {
		middleware.SetNoCache(w)
	}

	respondFile(w, r, userFile.Path(), userFile.LastModified(), rs)
}
