package exceptions

import (
	"net/http"
)

// GetStatusCodeForError returns an HTTP status code appropriate for the error type,
// defaulting to 500 Internal Server Error for generic errors
func GetStatusCodeForError(err error) int {
	switch err.(type) {
	case *UnauthorizedException:
		return http.StatusUnauthorized
	case *BadRequestException:
		return http.StatusBadRequest
	case *NotFoundException:
		return http.StatusNotFound
	case *ForbiddenException:
		return http.StatusForbidden
	}
	return http.StatusInternalServerError
}
