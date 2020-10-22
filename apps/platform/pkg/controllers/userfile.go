package controllers

import (
	"io"
	"net/http"
	"strconv"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// UploadUserFile function
func UploadUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)
	details, err := reqs.ConvertQueryToFileDetails(r.URL.Query())
	if err != nil {
		w.Write([]byte(err.Error()))
		return
	}
	//Attach file length to the details
	contentLenHeader := r.Header.Get("Content-Length")
	contentLen, err := strconv.ParseUint(contentLenHeader, 10, 64)
	if err != nil {
		w.Write([]byte("Must attach header 'Content-Length' with file upload"))
		return
	}
	details.ContentLength = contentLen

	newID, err := filesource.Upload(r.Body, *details, site, sess)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte(newID))
}

// DownloadUserFile function
func DownloadUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)
	userFileID := r.URL.Query().Get("userfileid")
	if userFileID == "" {
		w.Write([]byte("No userfileid in the request URL query"))
		return
	}
	fileStream, mimeType, err := filesource.Download(userFileID, site, sess)
	if err != nil {
		w.Write([]byte("Unable to load file"))
		return
	}
	w.Header().Set("content-type", mimeType)
	_, err = io.Copy(w, fileStream)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed to Download user file", http.StatusInternalServerError)
		return
	}
}

// DeleteUserFile function
func DeleteUserFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("content-type", "text")
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)
	userFileID := r.URL.Query().Get("userfileid")
	if userFileID == "" {
		w.Write([]byte("No userfileid in the request URL query"))
		return
	}

	err := filesource.Delete(userFileID, site, sess)
	if err != nil {
		w.Write([]byte(err.Error()))
		return
	}
	w.Write([]byte("ok"))
}
