var paths = new Map();
var skippedTags = ['script', 'input', 'header', 'footer', 'nav', 'style', 'meta', 'form', 'td'];
var skippedRoles = ['radio', 'button', 'checkbox', 'navigation'];

var filteredPage = new Array();
var removedElements = new Array();

function traverse(element) {
    // Get the same tagged children of the element
    const children = element.children;

    // Loop through the children
    for (let i = 0; i < children.length; i++) {
        // Traverse each child
        //check if the tag is in the skippedTags array
        let occur = 0;
        if (skippedTags.includes(children[i].tagName.toLowerCase())) {
            continue;
        }

        //check if the role is in the skippedRoles array
        if (children[i].getAttribute('role')) {
            if (skippedRoles.includes(children[i].getAttribute('role').toLowerCase())) {
                continue;
            }
        }

        if (children[i].textContent) {
            var curr_path = getPath(children[i]);
            addNewPath(curr_path);
        }

        traverse(children[i]);
    }
}

function addNewPath(path) {
    if (paths.has(path)) {
        paths.set(path, paths.get(path) + 1);
    }
    else {
        paths.set(path, 1);
    }
    return paths.get(path);
}

function getPath(element) {
    let level = 0;
    // If the element has a parent, get the parent's path
    if (element.parentNode) {
        // Append the element's tag name and class name to the parent's path
        if (element.className) {
            return getPath(element.parentNode) + '/' + element.tagName + '.' + element.className;
        }
        else if (element.id) {
            return getPath(element.parentNode) + '/' + element.tagName + '#' + element.id;
        }

        else if (element.getAttribute('role') && element.tagName.toLowerCase() != 'svg') {
            return getPath(element.parentNode) + '/' + element.tagName + '&role&' + element.getAttribute('role');
        }

        else if (element.getAttribute('data-testid') && element.tagName.toLowerCase() != 'svg') {
            return getPath(element.parentNode) + '/' + element.tagName + '&data-testid&' + element.getAttribute('data-testid');
        }

        return getPath(element.parentNode) + '/' + element.tagName;

    } else {
        return '';
    }
}

function getPaths() {
    traverse(document.body);
    return paths;
}

function eliminatePaths() {
    let count = 0;
    //check if the path's occurrence is the same as its parent's occurrence
    //if so, remove it from the map
    for (let [key, value] of paths) {
        if (value == 1) {
            paths.delete(key);
            count++;
            continue;
        }

        let parent_path = key.substring(0, key.lastIndexOf('/'));
        if (paths.has(parent_path) && paths.get(parent_path) >= value) {
            paths.delete(key);
            count++;
        }
    }
}

function getListForAPath(path) {
    //split the path into elements
    let path_items = path.split('/');
    let last_element = path_items[path_items.length - 1];
    let elements = returnByIdentifier(last_element);

    let parent_path = "";
    if (path_items.length > 1) {
        parent_path = path_items[path_items.length - 2]
    }

    let parent = returnByIdentifier(parent_path.substring(parent_path.lastIndexOf('/') + 1))[0];
    let siblings = [];

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].parentNode == parent) {
            siblings.push(elements[i]);
        }
    }

    let matchFound = false;
    for (let i = 0; i < filteredPage.length; i++) {
        if (JSON.stringify(filteredPage[i]) === JSON.stringify(siblings)) {
            matchFound = true;
            break;
        }
    }
    if (!matchFound) {
        return siblings;
    }

    return [];
}


function printMap(map) {
    for (let [key, value] of map) {
        if (value > 1) {
            console.log(key + " = " + value);
        }
    }
}

function returnByIdentifier(last_element) {
    if (last_element.indexOf('.') == -1 && last_element.indexOf('#') == -1 && last_element.indexOf('&') == -1) {
        return document.getElementsByTagName(last_element);
    }

    let class_name = last_element.substring(last_element.indexOf('.') + 1);
    let id = last_element.substring(last_element.indexOf('#') + 1);
    let attribute_name = last_element.substring(last_element.indexOf('&') + 1, last_element.indexOf('&', last_element.indexOf('&') + 1));
    let attribute_value = last_element.substring(last_element.indexOf('&', last_element.indexOf('&') + 1) + 1);

    if (class_name) {
        return document.getElementsByClassName(class_name);
    }
    else if (id) {
        return document.getElementById(id);
    }
    else if (attribute_name && attribute_value) {
        return document.querySelectorAll('[' + attribute_name + '="' + attribute_value + '"]');
    }
    else {
        return [];
    }
}

function savePossibleLists() {
    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"];
    let j = 0;
    var element_list = [];
    for (let [key, value] of paths) {
        let elements = getListForAPath(key);
        if (elements.length > 1) {
            for (let i = 0; i < elements.length; i++) {
                if (!isParentMarked(elements[i])) {
                    elements[i].style.backgroundColor = colors[j];
                    //add attribute to element
                    elements[i].setAttribute("wfe-check", "checked");
                    element_list.push(elements[i]);
                }

                else {
                    paths.delete(key);
                }
            }
            j++;
            if (j == colors.length) {
                j = 0;
            }
        }
    }

    if (!filteredPage.includes(element_list)) filteredPage.push(element_list);
}

//recursively check if any parent is colored
function isParentMarked(element) {
    if (element.parentNode) {
        //is html element
        if (element.parentNode.tagName == "HTML") {
            return false;
        }

        //check if parent has attribute
        if (element.parentNode.hasAttribute("wfe-check")) {
            return true;
        }

        return isParentMarked(element.parentNode);
    }
    return false;
}

function removeElementFromDOM(text) {
    let count = 0;
    let i = 0;
    //remove from DOM if list element contains a text
    filteredPage.forEach(list => {
        list.forEach(element => {
            if (element.textContent.toLowerCase().indexOf(text.toLowerCase()) != -1) {
                //save element information
                let elementInfo = {
                    parentNode: element.parentNode,
                    element: element.cloneNode(true),
                    nextSibling: element.nextSibling,
                    listID: i
                }
                //add to removedElements
                removedElements.push(elementInfo);
                //remove from DOM

                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                    count++;
                    
                    /*
                    if(element.parentNode && !element.parentNode.childNodes){
                        //save the parent node
                        let parentInfo = {
                            parentNode: element.parentNode.parentNode,
                            element: element.parentNode.cloneNode(true),
                            nextSibling: element.parentNode.nextSibling,
                            listID: i,
                            parent: true
                        }
                        removedElements.push(parentInfo);
                        element.parentNode.remove();
                    }*/
                }

            }
        });
        i++;
    });

    console.log("Removed " + count + " elements from DOM");
}


function addRemovedElementsBack(word) {
    let count = 0;

    for (let i = removedElements.length - 1; i >= 0; i--) {
        let elementInfo = removedElements[i];
        if (!word || elementInfo.element.textContent.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
            let parent = elementInfo.parentNode;
            while (parent && removedElements.indexOf(parent) !== -1) {
                parent = parent.parentNode;
            }

            if (parent) {
                parent.appendChild(elementInfo.element);
                removedElements.splice(i, 1);
                filteredPage[elementInfo.listID].push(elementInfo.element);
                count++;
            }
        }
    }

    console.log(`Added ${count} elements back to DOM`);
}


function removeAfterRefresh() {
    // Retrieve filtered words from local storage
    chrome.storage.local.get(["filteredWords"], function (result) {
        let filteredWords = result.filteredWords || [];
        // Use the filtered words to filter elements on the page
        for (let i = 0; i < filteredWords.length; i++) {
            removeElementFromDOM(filteredWords[i]);
        }
    });
}

// options for the observer (which mutations to observe)
var config = { childList: true, subtree: true };

const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            getPaths();
            eliminatePaths();
            savePossibleLists();
            removeAfterRefresh();
        }
    }
};

// create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// start observing the target node for configured mutations
observer.observe(document.body, config);

//get the message from popup.js
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message == "filter") {
            removeElementFromDOM(request.word);
        }
    }
);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message == "clear_filtered_words") {
            addRemovedElementsBack();
        }
    }
);

//get the message from popup.js
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message == "add_back") {
            //add the elements contain word to the dom
            addRemovedElementsBack(request.word);
        }
    }
);
