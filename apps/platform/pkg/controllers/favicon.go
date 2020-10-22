package controllers

import (
	"net/http"
)

// Favicon is good
func Favicon(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Not Found", http.StatusNotFound)
}
