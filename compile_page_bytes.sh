#!/bin/bash

cd ./controller/

# build options below for the JS page using vite, uncomment to enable options

export VITE_APP_ON_DEVICE=1
export COMPRESSION_ENABLED=TRUE # uses gz compression

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
sed -i '' '1s/^/const /' toESP32/index.h

cp toESP32/index.h ../src/index.h
