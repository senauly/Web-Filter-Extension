var paths = new Map();
var skippedTags = ['script', 'input', 'header', 'footer', 'nav', 'style', 'meta', 'form', 'td'];
var skippedRoles = ['radio', 'button', 'checkbox', 'navigation'];

var lists = new Array();

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

        if(children[i].textContent) {
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
        if(element.className) {
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
        let parent_path = key.substring(0, key.lastIndexOf('/'));
        if (paths.has(parent_path) && paths.get(parent_path) >= value) {
            paths.delete(key);
            count++;
        }
    }
    console.log("Eliminated " + count + " paths");
}

function getList(path){
    //split the path into elements
    let path_items = path.split('/');
    let last_element = path_items[path_items.length - 1];
    let elements = returnByIdentifier(last_element);

    let parent_path = "";
    if( path_items.length > 1){
        parent_path = path_items[path_items.length - 2]
    }

    let parent = returnByIdentifier(parent_path.substring(parent_path.lastIndexOf('/') + 1))[0];
    let siblings = [];
    
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].parentNode == parent) {
            siblings.push(elements[i]);
        }

        else {
            //remove from path
            paths.delete(path);
        }
    }
    return siblings;
}

function printMap(map) {
    for (let [key, value] of map) {
        if(value > 1) {
            console.log(key + " = " + value);
        }
    }
}

function returnByIdentifier(last_element) {
    if(last_element.indexOf('.') == -1 && last_element.indexOf('#') == -1 && last_element.indexOf('&') == -1) {
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

function colorPaths() {
    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"];
    let j = 0;
    var element_list = [];
    for (let [key, value] of paths) {
        if(value > 1) {
            let elements = getList(key);
            if(elements.length > 1) {
                for(let i = 0; i < elements.length; i++) {
                    if(!isParentColored(elements[i])){
                        elements[i].style.backgroundColor = colors[j];
                        element_list.push(elements[i]);
                    }
                }
                j++;
                if(j == colors.length) {
                    j = 0;
                }
            }
        }
    }

    lists.push(element_list);
}

//recursively check if any parent is colored
function isParentColored(element) {
    if(element.parentNode) {
        if(element.parentNode.style && element.parentNode.style.backgroundColor) {
            return true;
        }
        return isParentColored(element.parentNode);
    }
    return false;
}

function removeElementFromDOM(text){
    //remove from DOM if list element contains a text
    for(let i = 0; i < lists.length; i++) {
        for(let j = 0; j < lists[i].length; j++) {
            if(lists[i][j].textContent.indexOf(text) != -1) {
                //remove from DOM
                console.log("Removed object from DOM: " + text);
                lists[i][j].parentNode.removeChild(lists[i][j]);
            }
        }
    }
}

getPaths();
eliminatePaths();
colorPaths();
//printMap(paths);
removeElementFromDOM("Arama Arama");


