CPP = emcc
CPPFLAGS = -O3 -s INITIAL_MEMORY=318767104 -s FILESYSTEM=0 -s ENVIRONMENT=node -s EXPORT_ES6=1 -s MODULARIZE=instance -s EXPORTED_RUNTIME_METHODS=['HEAPU8'] --minify 0

COMMONDIR = vendor/brotli/common
ENCDIR = vendor/brotli/enc
ENCSRC = src/compress.c $(wildcard $(COMMONDIR)/*.c) $(wildcard $(ENCDIR)/*.c)
ENCOBJ = $(ENCSRC:.c=.o)

all: build

.c.o .cc.o:
	$(CPP) -I vendor/brotli/include -c $< -o $@

build: $(ENCOBJ)
	rm -rf dist && mkdir -p dist/
	$(CPP) $(CPPFLAGS) -s EXPORTED_FUNCTIONS="['_encodeWithDictionary', '_malloc', '_free']" $(ENCOBJ) -o src/encode.js
