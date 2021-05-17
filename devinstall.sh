#!/bin/bash

tsc --build
npm pack
npm install -g *.tgz
rm -f *.tgz
