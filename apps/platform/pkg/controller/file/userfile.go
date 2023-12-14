package file

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
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

	//Attach file length to the details
	contentLenHeader := r.Header.Get("Content-Length")
	contentLen, err := strconv.ParseInt(contentLenHeader, 10, 64)
	if err != nil {
		return nil, errors.New("must attach header 'content-length' with file upload")
	}
	op.ContentLength = contentLen

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
				return nil, errors.New("No name specified")
			}
			if op.CollectionID == "" {
				return nil, errors.New("No collectionid specified")
			}
			if op.RecordID == "" {
				return nil, errors.New("No recordid specified")
			}
			op.Data = part
			results, err := filesource.Upload([]*filesource.FileUploadOp{op}, nil, session, op.Params)
			if err != nil {
				return nil, err
			}
			if len(results) != 1 {
				return nil, errors.New("Upload Failed: Invalid Response")
			}
			result = results[0]
		}
	}
	return result, nil

}

func UploadUserFile(w http.ResponseWriter, r *http.Request) {
	if result, err := processUploadRequest(r); err != nil {
		ctlutil.HandleError(w, err)
	} else {
		RespondJSON(w, r, result)
	}
}

// DeleteUserFile deletes the requested user file
func DeleteUserFile(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	if err := filesource.Delete(mux.Vars(r)["fileid"], session); err != nil {
		ctlutil.HandleError(w, err)
	} else {
		RespondJSON(w, r, &bot.BotResponse{
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
		ctlutil.HandleError(w, exceptions.NewBadRequestException("missing required query parameter: userfileid"))
		return
	}
	buf := &bytes.Buffer{}
	if userFile, err := filesource.Download(buf, userFileID, session); err != nil {
		ctlutil.HandleError(w, err)
	} else {
		respondFile(w, r, &FileRequest{
			Path:         userFile.Path,
			LastModified: time.Unix(userFile.UpdatedAt, 0),
			Namespace:    "",
			Version:      version,
		}, bytes.NewReader(buf.Bytes()))
	}
}
