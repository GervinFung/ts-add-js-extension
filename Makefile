importOutput1=sample1-output.js
importOutput2=sample2-output.js
exportOutput1=sample1-output.js
exportOutput2=sample2-output.js

import=import
export=export

sampleImport=sample/${import}
sampleExport=sample/${export}

create:
	cd test && mkdir -p output\
	&& cd output && mkdir -p import\
	&& cd import && touch ${importOutput1} && touch ${importOutput2}\
	&& cd ../ && mkdir -p export\
	&& cd export && touch ${exportOutput1}

copy:
	cd test\
	&& cp ${sampleImport}/sample1.js output/${import}/${importOutput1}\
	&& cp ${sampleImport}/sample2.js output/${import}/${importOutput2}\
	&& cp ${sampleExport}/sample1.js output/${export}/${exportOutput1}\
	&& cp ${sampleExport}/sample2.js output/${export}/${exportOutput2}

publish:
	git push
	yarn build
	npm publish

