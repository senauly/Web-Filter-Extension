/*search and save lists logic */

function traverse(element) {
    // Get the same tagged children of the element
    if (element.getAttribute['wfe-check']) return;
    if (element.nodeType != 1) return;
    if (!element.textContent) return;

    const children = element.children;
    if (!children) return;

    // Loop through the children
    for (let i = 0; i < children.length; i++) {
        if (element.nodeType != 1) continue;
        // Traverse each child
        //check if the tag is in the skippedTags array
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
    if (!(element instanceof Element)) {
        throw new Error("Expected a DOM element as argument.");
    }
    // Check if the element is the HTML element
    if (element.tagName === 'HTML') {
        return element.tagName;
    }
    // If the element has a parent, get the parent's path
    if (element.parentNode) {
        // Append the element's tag name and class name to the parent's path
        let path = getPath(element.parentNode) + ' > ' + element.tagName;

        if (element.classList.length > 0) {
            path += '.' + Array.from(element.classList).join('.');
        }        

        if (element.id) {
            path += '#' + element.id;
        }

        return path;
    } else {
        return '';
    }
}


function getPaths(element) {
    let li = document.body.querySelectorAll("li");
    for (let i = 0; i < li.length; i++) {
        if (li[i].innerText) {
            filteredPage.add(li[i]);
        }
    }
    traverse(element);
    return paths;
}

function savePossibleLists() {
    for (let [key, value] of paths) {
        if(value > 2) {
            try{
                let elements = document.querySelectorAll(key);
                if (elements && elements.length > 1) {
                    for (let i = 0; i < elements.length; i++) {
                        if (!isParentMarked(elements[i])) {
                            elements[i].setAttribute("wfe-check", "checked");
                            //add all the siblings to the list

                            let parent = elements[i].parentNode;
                            let children = parent.querySelectorAll("*");
                            for (let j = 0; j < children.length; j++) {
                                children[j].setAttribute("wfe-check", "checked");
                                filteredPage.add(children[j]);
                            }

                        }

                        else {
                            paths.delete(key);
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }
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

    }
    return false;
}

/* remove and add logic */

function removeElementFromDOM(text) {
    chrome.storage.local.get("blur", function (data) {
        let blur = data.blur;
        //check if the Set element's text contains the text
        for (let element of filteredPage) {
            if (element.getAttribute("wfe-check") != "hidden" && element.innerText &&
                element.innerText.toLowerCase().indexOf(text.toLowerCase()) != -1) {
                if (element.parentNode) {
                    if (blur) {
                        element.style.setProperty("filter", "blur(10px)");
                    }
                    else {
                        element.style.setProperty("display", "none");
                    }

                    //add attribute to element
                    element.setAttribute("wfe-check", "hidden");

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
        }
    });
}


function addRemovedElementsBack(word) {
    //get blur from storage
    chrome.storage.local.get("blur", function (data) {
        let blur = data.blur;
        var addBack = false;
        //get all the elements with the attribute and check value

        let elements = document.querySelectorAll('[wfe-check="hidden"]');
        for (let i = 0; i < elements.length; i++) {
            if (word && elements[i].innerText && elements[i].innerText.toLowerCase().indexOf(word.toLowerCase()) != -1) {
                addBack = true;
            }

            else if (!word) {
                addBack = true;
            }

            if (addBack) {
                //check if it has other filtered words in it
                //get filtered words
                chrome.storage.local.get(["filteredWords"], function (result) {
                    let filteredWords = result.filteredWords || [];
                    let hasKeyword = filteredWords.some(function (filter) {
                        return elements[i].innerText.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
                    });
                    if (hasKeyword) {
                        return;
                    }

                    if (elements[i].parentNode && elements[i].parentNode.getAttribute("wfe-check") == "hiddenParent") {
                        //remove style 
                        elements[i].parentNode.style.setProperty("display", "");
                        elements[i].parentNode.removeAttribute("wfe-check");

                        if (blur) {
                            elements[i].parentNode.style.setProperty("filter", "none");
                        }
                    }

                    elements[i].style.setProperty("display", "");
                    elements[i].removeAttribute("wfe-check");

                    if (blur) {
                        elements[i].style.setProperty("filter", "none");
                    }
                });
            }
        }
    });
}

function blurElements() {
    let elements = document.querySelectorAll('[wfe-check="hidden"]');
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.setProperty("filter", "blur(10px)");
        elements[i].style.setProperty("display", "");
    }
}

function unblurElements() {
    let elements = document.querySelectorAll('[wfe-check="hidden"]');
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.setProperty("filter", "none");
        elements[i].style.setProperty("display", "none");
    }
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

/* learning mode logic */

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
        if (!parent) {
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
    var learnedElements = document.querySelectorAll("[wfe-check='learned']");;

    learnedElements.forEach(element => {
        if (element.tagName != 'BODY' && element.tagName != 'HTML') {
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
                            if (element.childNodes[i].attributes[j].name != "wfe-check" || element.childNodes[i].attributes[j].name != "style") {
                                var attribute = element.childNodes[i].attributes[j].name + " = " + element.childNodes[i].attributes[j].value;
                                attributes.add(attribute);
                            }
                        }
                        break;
                    }
                }
            }
        }
    });

    return attributes;
}

function saveLearnedElements() {

    var attributes = getAttributesOfTheElements();
    if (attributes.size == 0) window.location.reload();
    // Get the current website's domain
    var currentDomain = window.location.hostname;

    //get the learned elements from the storage and check if this domain is already in the storage
    chrome.storage.local.get(["learnedElements"], function (result) {
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
        // Save the object to the local storage
        chrome.storage.local.set({ "learnedElements": learnedElementsData });
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
        var elementsWithAttribute = new Array();
        switch (attributeName) {
            case "class":
                elementsWithAttribute = document.getElementsByClassName(attributeValue);
                break;

            case "id":
                var element = document.getElementById(attributeValue);
                if (element) {
                    elementsWithAttribute.push(element);
                }
                break;

            default:
                elementsWithAttribute = document.querySelectorAll("[" + attributeName + "='" + attributeValue + "']");
                break;
        }

        for (var i = 0; i < elementsWithAttribute.length; i++) {
            filteredPage.add(elementsWithAttribute[i]);
        }
    });

}


var paths = new Map();
var skippedTags = ['script', 'input', 'header', 'footer', 'nav', 'style', 'meta', 'form', 'td','li'];
var skippedRoles = ['radio', 'button', 'checkbox', 'navigation'];

var filteredPage = new Set();

var learning_mode = false;
var learned_elements = false;
var learnedAttributes = new Array();

//get mode from local storage
chrome.storage.local.get(["learning_mode"], function (result) {
    learning_mode = result.learning_mode;
    if (!learning_mode) {
        //get the learned elements from the storage and check if this domain is in the storage
        chrome.storage.local.get(["learnedElements"], function (result) {
            var learnedElementsData = result.learnedElements || { domain: "", attributes: [] };
            if (learnedElementsData.domain == window.location.hostname) {
                //filtered page is the learned elements
                if (learnedElementsData.attributes.length > 0) {
                    learnedAttributes = learnedElementsData.attributes;
                    learned_elements = true;
                }
            }
        });

        if (learned_elements) {
            var config = { childList: true, attributes: true, attributeFilter: learnedAttributes };
        }

        else {
            var config = { childList: true, subtree: true };
        }

        const callback = async function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    //get the blur from storage
                    if (learned_elements) {
                        getElementsWithAttributes(learnedAttributes);
                        removeAfterRefresh();
                    }

                    else {
                        getPaths(document.body);
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

        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.message == "filter") {
                    //timer
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

        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.message == "add_back") {
                    //add the elements contain word to the dom
                    addRemovedElementsBack(request.word);
                }
            }
        );

        chrome.storage.onChanged.addListener(function (changes, namespace) {
            if (changes.blur) {
                if (changes.blur.newValue) {
                    blurElements();
                } else {
                    unblurElements();
                }
            }
        });


        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.message == "learning_mode") {
                    learning_mode = true;
                    observer.disconnect();
                    //set local storage 
                    chrome.storage.local.set({ learning_mode: true });
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

                        if (event.code === "KeyR" && event.ctrlKey) {
                            //reset learning mode
                            if (confirm("Previously learned elements for this domain will be reseted. Do you want to continue?")) {
                                //reset the learned elements for this domain only
                                chrome.storage.local.get(["learnedElements"], function (result) {
                                    var learnedElementsData = result.learnedElements || { domain: "", attributes: [] };
                                    if (learnedElementsData.domain == window.location.hostname) {
                                        learnedElementsData.attributes = [];
                                        chrome.storage.local.set({ "learnedElements": learnedElementsData });
                                    }
                                });
                            }
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