output1 = 'sample1-output.js'
output2 = 'sample2-output.js'
output3 = 'sample3-output.js'

create:
	cd test && mkdir -p output && cd output && touch ${output1} && touch ${output2} && touch ${output3}

copy:
	cd test && cp sample/sample1.js output/${output1} && cp sample/sample2.js output/${output2} && cp sample/sample3.js output/${output3}

publish:
	git push && yarn build && npm publish

