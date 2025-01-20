#!/bin/bash

cd ./controller/

# build options below for the JS page using vite, uncomment to enable options

export VITE_APP_PRINT_INPUT= # print the input in the output box by default.
# export VITE_APP_NEWLINES_SEPARATOR=\\n\\r # default selection for the CR CRLF NONE menu, can be empty, \\n or \\n\\r
# export VITE_APP_HIDE_NEWLINE_SEPARATOR_MENU= # include the menu for CR CRLF NONE
export VITE_APP_WIFI_CONFIG= # enable the wifi config button and form
export VITE_APP_AUTORECONNECT_SOCKETS= # if the connection dies, it will auto reconnect
# export VITE_APP_WIFI_CONFIG_DEFAULT_HOST=http://192.168.0.1 # hostname of esp32
# export VITE_APP_DEFAULT_URL=ws://192.168.0.1/ws # default websockets url
# export VITE_APP_START_CONNECTED_SOCKETS= # starts a connection on page load
export VITE_APP_INCLUDE_CONNECTION_URL= # if disabled enable VITE_APP_START_CONNECTED_SOCKETS
export COMPRESSION_ENABLED=FALSE # uses gz compression

npm run build

if [ ! -z "${COMPRESSION_ENABLED}" ]; then
    echo "Compressing index.html"
    gzip -c -9 toESP32/index.html > toESP32/index.html.gz
    xxd -i toESP32/index.html.gz > toESP32/index.h
else
    echo "Not compressing index.html"
    xxd -i toESP32/index.html > toESP32/index.h
fi

echo "Adding const to index.h"
sed -i '1s;^;const ;' toESP32/index.h

cp toESP32/index.h ../src/index.h
