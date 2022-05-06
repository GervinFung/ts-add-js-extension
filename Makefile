.PHONY: build test all
MAKEFLAGS += --silent

NODE_BIN=node_modules/.bin/

build:
	rm -rf build && $(NODE_BIN)tsc

test: build
	cd test && rm -rf output && mkdir output && cp -r sample/* output && cd ../ && node test
