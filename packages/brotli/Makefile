CPP = emcc
CPPFLAGS = -O3 -s INITIAL_MEMORY=318767104 -s FILESYSTEM=0 -s EXPORT_ES6=1 -s MODULARIZE=1 -s 'EXPORT_NAME="brotli"' -s "EXPORTED_RUNTIME_METHODS=['getValue','setValue','writeArrayToMemory','HEAP8','HEAPU8']" --closure 1 --minify 0 -- --emit-tsd brotli.d.ts

COMMONDIR = vendor/brotli/c/common
ENCDIR = vendor/brotli/c/enc
DECDIR = vendor/brotli/c/dec
ENCSRC = src/compress.c src/decompress.c $(wildcard $(COMMONDIR)/*.c) $(wildcard $(ENCDIR)/*.c) $(wildcard $(DECDIR)/*.c)
ENCOBJ = $(ENCSRC:.c=.o)

all: build

.c.o .cc.o:
	$(CPP) -I vendor/brotli/c/include -c $< -o $@

build: $(ENCOBJ)
	$(CPP) $(CPPFLAGS) -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_encodeWithDictionary', '_decompress']" $(ENCOBJ) -o src/brotli.js
