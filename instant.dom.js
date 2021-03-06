var instantDOM = (function() {
	var updateDOM = function(element, newDOM) {
		var $element = $(element),
			$children = $element.children(),
			oldDOM = $element.html();
			oldElementTree = getElementTree(oldDOM),
			newElementTree = getElementTree(newDOM);

		var offset = 0;
		for(var i = 0, j = newElementTree.length; i < j; i++) {
			var transformations = compareNodes(newElementTree[i + offset], oldElementTree[i - offset]);

			if(transformations) { 
				if(transformations[0] && transformations[0].type === 'nodeName') {
					// Insert node
					$children.eq(i).after(renderNode(transformations));

					offset++;
					j++;
				}

				for(var n = 0, m = transformations.length; n < m; n++) {
					// Update HTML
					if(transformations[n].type === 'html') {
						$children.eq(i).html(transformations[n].newValue);

					// Update attributes
					} else if(transformations[n].type === 'attribute') {
						// Update attribute
						if(transformations[n].value !== null) {
							$children.eq(i).attr(transformations[n].key, transformations[n].value);

						// Remove attribute
						} else {
							$children.eq(i).removeAttr(transformations[n].key);
						}
					}
				}
			} else {
				if(oldElementTree[i - offset]) {
					// Delete node
					$children.eq(i - offset).remove();
				}
				if(newElementTree[i]) {
					// Append node
					$element.append(newElementTree[i].source);
				}
			}
		}
	};

	var getElementTree = function(dom) {
		var nodes = [],
			offset = 0,
			nextDomNode = {};

		nextDomNode = getNextNode(dom, offset);
		while(nextDomNode) {
			offset = nextDomNode.endIndex;
			nodes.push(nextDomNode);

			nextDomNode = getNextNode(dom, offset);
		}

		console.log(nodes);

		return nodes;
	};

	var getNextNode = function(dom, offset) {
		if(!offset) offset = 0;

		var slicedDOM = dom.slice(offset),
			startIndex = slicedDOM.search(/<[^\/]*>/),
			headerEndIndex = slicedDOM.search(/>/),
			header = slicedDOM.slice(startIndex, headerEndIndex).replace('<', '').split(' '),
			nodeName = header[0],
			endIndex = slicedDOM.search('</' + nodeName + '>') + ('</' + nodeName + '>').length,
			source = slicedDOM.slice(startIndex, endIndex),
			attributes = [],
			html = slicedDOM.slice(headerEndIndex + 1, endIndex - ('</' + nodeName + '>').length),
			text = html.replace(/<.*>.*<\/[^\/]*>/, '');

		for(var i = 1, j = header.length; i < j; i++) {
			var parts = header[i].split('=');

			attributes.push({
				key: parts[0],
				value: parts[1].replace(/"/g, '')
			});
		}

		if(startIndex !== -1) {
			return {
				startIndex: offset + startIndex,
				endIndex: offset + endIndex,
				nodeName: nodeName,
				attributes: attributes,
				html: html,
				text: text,
				source: source,
				children: getElementTree(html)
			};
		}
	};

	var compareNodes = function(newNode, oldNode) {
		if(newNode && oldNode) {
			var newNodeAttributes = newNode.attributes,
				oldNodeAttributes = oldNode.attributes,
				transformations = [];

			if(newNode.nodeName !== oldNode.nodeName) {
				transformations.push({
					type: 'nodeName',
					oldValue: oldNode.nodeName,
					newValue: newNode.nodeName
				});
			}
			if(newNode.html !== oldNode.html) {
				transformations.push({
					type: 'html',
					oldValue: oldNode.html,
					newValue: newNode.html
				});
			}

			// Add missing attributes
			for(var i = 0, j = newNodeAttributes.length; i < j; i++) {
				var isSynced = false;
				for(var n = 0, m = oldNodeAttributes.length; n < m; n++) {
					isSynced = newNodeAttributes[i].key === oldNodeAttributes[n].key &&
							newNodeAttributes[i].value === oldNodeAttributes[n].value;
				}

				if(!isSynced) {
					transformations.push({
						type: 'attribute',
						key: newNodeAttributes[i].key,
						value: newNodeAttributes[i].value
					});
				}
			}

			// Remove unused attributes
			for(var i = 0, j = oldNodeAttributes.length; i < j; i++) {
				var isUnused = true;
				for(var n = 0, m = newNodeAttributes.length; n < m; n++) {
					if(newNodeAttributes[i]) {
						isUnused = newNodeAttributes[i].key !== oldNodeAttributes[n].key;
					}
				}

				if(isUnused) {
					transformations.push({
						type: 'attribute',
						key: oldNodeAttributes[i].key,
						value: null
					});
				}
			}

			return transformations;
		} else {
			return undefined;
		}
	};

	var renderNode = function(transformations) {
		var nodeHTML = '<' + transformations[0].newValue;
		var htmlBody = '';

		for(var i = 1, j = transformations.length; i < j; i++) {
			if(transformations[i].type === 'attribute' && transformations[i].value) {
				nodeHTML += ' ' + transformations[i].key + '="' + transformations[i].value + '"';
			} else if(transformations[i].type === 'html') {
				htmlBody = transformations[i].newValue;
			}
		}

		nodeHTML += '>' + htmlBody + '</' + transformations[0].newValue + '>';

		return nodeHTML;
	};

	return {
		updateDOM: updateDOM
	};
})();