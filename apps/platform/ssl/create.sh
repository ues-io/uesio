openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout private.key -days 3560 -out certificate.crt -config config.txt