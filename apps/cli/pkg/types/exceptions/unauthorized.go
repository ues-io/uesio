package exceptions

type UnauthorizedException struct {
	msg string
}

func NewUnauthorizedException(msg string) *UnauthorizedException {
	return &UnauthorizedException{msg}
}
func (e *UnauthorizedException) Error() string {
	return e.msg
}
