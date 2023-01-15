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

    if (class_name) {
        return document.getElementsByClassName(class_name);
    }
    else if (id) {
        return document.getElementById(id);
    }
    else {
        return [];
    }
}

function savePossibleLists() {
    var element_list = [];
    for (let [key, value] of paths) {
        let elements = getListForAPath(key);
        if (elements.length > 1) {
            for (let i = 0; i < elements.length; i++) {
                if (!isParentMarked(elements[i])) {
                    elements[i].setAttribute("wfe-check", "checked");
                    element_list.push(elements[i]);
                }

                else {
                    paths.delete(key);
                }
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

        //check if parent has attribute and check the value
        if (element.parentNode.getAttribute("wfe-check") == "checked") {
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
            if (element.getAttribute("wfe-check") != "hidden" &&
                element.textContent.toLowerCase().indexOf(text.toLowerCase()) != -1) {
                if (element.parentNode) {
                    //element.style.setProperty("filter", "blur(10px)");
                    element.style.setProperty("display", "none");
                    //add attribute to element
                    element.setAttribute("wfe-check", "hidden");

                    count++;

                    if (element.parentNode && !element.parentNode.childNodes) {
                        //check if all child nodes are hidden
                        let allHidden = true;
                        for (let i = 0; i < element.parentNode.childNodes.length; i++) {
                            //check the wfe-check value
                            if (element.parentNode.childNodes[i].getAttribute("wfe-check") != "hidden") {
                                allHidden = false;
                                break;
                            }
                        }

                        if (allHidden) {
                            element.parentNode.style.setProperty("display", "none");
                            element.parentNode.setAttribute("wfe-check", "hiddenParent");
                        }
                    }
                }
            }
        });
        i++;
    });
}


function addRemovedElementsBack(word) {
    let count = 0;
    var addBack = false;
    //get all the elements with the attribute and check value

    let elements = document.querySelectorAll('[wfe-check="hidden"]');
    for (let i = 0; i < elements.length; i++) {
        if (word && elements[i].textContent && elements[i].textContent.toLowerCase().indexOf(word.toLowerCase()) != -1) {
            addBack = true;
        }

        else if (!word) {
            addBack = true;
        }

        if (addBack) {
            if (elements[i].parentNode && elements[i].parentNode.getAttribute("wfe-check") == "hiddenParent") {
                elements[i].parentNode.style.setProperty("display", "block");
                elements[i].parentNode.removeAttribute("wfe-check");
            }

            elements[i].style.setProperty("display", "block");
            elements[i].removeAttribute("wfe-check");
            count++;
        }
    }
}


function removeAfterRefresh() {
    // Retrieve filtered words from sync storage
    chrome.storage.sync.get(["filteredWords"], function (result) {
        let filteredWords = result.filteredWords || [];
        // Use the filtered words to filter elements on the page
        for (let i = 0; i < filteredWords.length; i++) {
            removeElementFromDOM(filteredWords[i]);
        }
    });
}

function colorizeLists() {
    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"];
    let i = 0;
    filteredPage.forEach(list => {
        list.forEach(element => {
            element.style.backgroundColor = colors[i];
            if (i == colors.length) {
                i = 0;
            }
        });
        i++;
    });
}

function learnElement(parentNode, firstElement) {
    //colorize the childNodes of the element
    //add the element to the list of learned elements
    var i = 0;

    parentNode.childNodes.forEach(element => {
        //if attribute can be added
        if (element.nodeType == 1) {
            element.setAttribute("wfe-check", "learned");
            var color = "blue";
            if (i % 2 == 0) {
                color = "green";
            }
            i++;
            element.style.backgroundColor = color;
        }
    });

    return parentNode;
}

function findParentOfRepeatedElements(element) {

    while (element) {
        let parent = element.parentNode;
        if(!parent){
            return null;
        }
        let siblings = parent.children;
        let sameTagNameCount = 0;
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i].tagName === element.tagName) {
                sameTagNameCount++;
            }
        }
        if (sameTagNameCount > 2) {
            return parent;
        }
        element = parent;
    }
    return null;
}

function getAttributesOfTheElements(element) {
    var attributes = new Set();
    var learnedElements = document.querySelectorAll("[wfe-check='learned']");

    learnedElements.forEach(element => {
        for (let i = 0; i < element.attributes.length; i++) {
            if (element.attributes[i].name != "wfe-check" && element.attributes[i].name != "style") {
                var attribute = element.attributes[i].name + " = " + element.attributes[i].value;
                attributes.add(attribute);
            }
        }

        //if attribute length is 0, get the attrbiutes of the first child
        if (element.attributes.length == 0) {
            for (let i = 0; i < element.childNodes.length; i++) {
                if (element.childNodes[i].nodeType == 1) {
                    for (let j = 0; j < element.childNodes[i].attributes.length; j++) {
                        if(element.childNodes[i].attributes[j].name != "wfe-check" || element.childNodes[i].attributes[j].name != "style"){
                            var attribute = element.childNodes[i].attributes[j].name + " = " + element.childNodes[i].attributes[j].value;
                            attributes.add(attribute);
                        }
                    }
                    break;
                }
            }
        }
    });

    return attributes;
}

function saveLearnedElements() {

    var attributes = getAttributesOfTheElements();
    // Get the current website's domain
    var currentDomain = window.location.hostname;

    //get the learned elements from the storage and check if this domain is already in the storage
    chrome.storage.sync.get(["learnedElements"], function (result) {
        var learnedElementsData = result.learnedElements || { domain: "", attributes: [] };
        if (learnedElementsData.domain == currentDomain) {
            //add the new learned elements to the existing ones
            learnedElementsData.attributes = learnedElementsData.attributes.concat(Array.from(attributes));
        } else {
            //create a new object
            learnedElementsData = {
                domain: currentDomain,
                attributes: Array.from(attributes)
            };
        }
        // Save the object to the sync storage
        chrome.storage.sync.set({ "learnedElements": learnedElementsData });
    });

    //refresh the page
    window.location.reload();
}

function getElementsWithAttributes(attributes) {
    var elements = new Set();
    //check the attribute name and value
    if (!attributes || attributes.length == 0) {
        return;
    }

    attributes.forEach(attribute => {
        var attributeName = attribute.split(" = ")[0];
        var attributeValue = attribute.split(" = ")[1];
        var elementsWithAttribute = document.querySelectorAll("[" + attributeName + "='" + attributeValue + "']");
        if (elementsWithAttribute.length > 0) {
            elementsWithAttribute.forEach(element => {
                elements.add(element);
            });
        }
    });

    filteredPage.push(elements);
}

var paths = new Map();
var skippedTags = ['script', 'input', 'header', 'footer', 'nav', 'style', 'meta', 'form', 'td'];
var skippedRoles = ['radio', 'button', 'checkbox', 'navigation'];

var filteredPage = new Array();
var removedElements = new Array();

var learning_mode = false;
var learned_elements = false;
var learnedAttributes = new Array();

//get mode from sync storage
chrome.storage.sync.get(["learning_mode"], function (result) {
    learning_mode = result.learning_mode;
    if (!learning_mode) {

        //get the learned elements from the storage and check if this domain is in the storage
        chrome.storage.sync.get(["learnedElements"], function (result) {
            var learnedElementsData = result.learnedElements || { domain: "", attributes: [] };
            if (learnedElementsData.domain == window.location.hostname) {
                //filtered page is the learned elements
                learnedAttributes = learnedElementsData.attributes;
                learned_elements = true;
            }
        });

        var config = { childList: true, subtree: true };

        const callback = function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (learned_elements) {
                        getElementsWithAttributes(learnedAttributes);
                        removeAfterRefresh();
                    }

                    else {
                        getPaths();
                        eliminatePaths();
                        savePossibleLists();
                        removeAfterRefresh();
                    }
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

        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.message == "learning_mode") {
                    learning_mode = true;
                    observer.disconnect();
                    //set sync storage 
                    chrome.storage.sync.set({ learning_mode: true });
                    var hoveredElement;

                    document.body.addEventListener("mouseover", function (event) {
                        hoveredElement = event.target;
                    });

                    document.body.addEventListener("keydown", function (event) {
                        // Check if the key pressed is the one you want
                        if (event.code === "KeyS") {
                            if (hoveredElement) {
                                var outerElement = findParentOfRepeatedElements(hoveredElement);
                                if (outerElement) {
                                    learnElement(outerElement);

                                }
                            }
                        }

                        if (event.code === "KeyC") {
                            //clear the selection
                            document.querySelectorAll("[wfe-check='learned']").forEach(element => {
                                element.removeAttribute("wfe-check");
                                element.style.backgroundColor = "";
                            });
                        }
                    });

                    chrome.runtime.onMessage.addListener(
                        function (request, sender, sendResponse) {
                            if (request.message == "stop_learning_mode") {
                                saveLearnedElements();
                            }
                        }
                    );
                }
            }
        );

    }
});