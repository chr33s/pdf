CPP = emcc
CPPFLAGS = -O3 -s INITIAL_MEMORY=318767104 -s FILESYSTEM=0 -s ENVIRONMENT=node -s EXPORT_ES6=1 -s MODULARIZE=instance --minify 0 --pre-js src/enc/pre.ts

COMMONDIR = vendor/brotli/common
ENCDIR = vendor/brotli/enc
ENCSRC = src/enc/encode.c $(wildcard $(COMMONDIR)/*.c) $(wildcard $(ENCDIR)/*.c)
ENCOBJ = $(ENCSRC:.c=.o)

all: build

.c.o .cc.o:
	$(CPP) -I vendor/brotli/include -c $< -o $@

build: src/enc/pre.ts $(ENCOBJ)
	$(CPP) $(CPPFLAGS) -s EXPORTED_FUNCTIONS="['_encode', '_malloc', '_free']" $(ENCOBJ) -o src/enc/encode.js
	npx -y tsx scripts/generate-mem.ts src/enc/encode.wasm src/enc/mem.js
	rm src/enc/encode.wasm
