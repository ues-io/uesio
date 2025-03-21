package exceptions

import (
	"errors"
	"net/http"
)

// GetStatusCodeForError returns an HTTP status code appropriate for the error type,
// defaulting to 500 Internal Server Error for generic ctlutil
func GetStatusCodeForError(err error) int {
	if IsType[*UnauthorizedException](err) {
		return http.StatusUnauthorized
	}

	if IsType[*BadRequestException](err) {
		return http.StatusBadRequest
	}

	if IsType[*InvalidParamException](err) {
		return http.StatusBadRequest
	}

	if IsType[*ExecutionException](err) {
		return http.StatusBadRequest
	}

	if IsType[*NotFoundException](err) {
		return http.StatusNotFound
	}

	if IsType[*SystemBotNotFoundException](err) {
		return http.StatusNotFound
	}

	if IsType[*ForbiddenException](err) {
		return http.StatusForbidden
	}

	if IsType[*DuplicateException](err) {
		return http.StatusConflict
	}

	return http.StatusInternalServerError
}

func IsType[K error](err error) bool {
	var e K
	return errors.As(err, &e)
}
