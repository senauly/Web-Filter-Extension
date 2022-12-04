const paths = new Map();
const skippedTags = ['script', 'input', 'form', 'header', 'footer', 'nav', 'style', 'meta'];

function traverse(element) {
    // Get the children of the current element
    const children = element.children;

    // Loop through the children
    for (let i = 0; i < children.length; i++) {
        // Traverse each child
        //check if the tag is in the skippedTags array
        let occur = 0;
        if (skippedTags.includes(children[i].tagName.toLowerCase())) {
            continue;
        }

        if(children[i].textContent) {
            var curr_path = getPath(children[i]);
            //add attribute to the element
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
        if (element.id) {
            return getPath(element.parentNode) + '/' + element.tagName + '#' + element.id;
        }
        return getPath(element.parentNode) + '/' + element.tagName;


    } else {
        // Otherwise, return the element's tag name and class name
        return element.tagName + '.' + element.className;
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

function removePathFromDOM(path) {
    for (let [key, value] of map) {
        if(key == path) {
            let element = document.querySelector(path);
            element.remove();
        }
    }
}

function findThePath(path){
    //get the last element of the path
    let last_element = path.substring(path.lastIndexOf('/') + 1);
    //get the tag name
    let tag_name = last_element.substring(0, last_element.indexOf('.'));
    //get the class name
    let class_name = last_element.substring(last_element.indexOf('.') + 1);
    //get the id
    let id = last_element.substring(last_element.indexOf('#') + 1);

    //get the elements with the same class name
    let elements = document.getElementsByClassName(class_name);
    //change the background color of the elements
    return elements;

}

function printMap(map) {
    for (let [key, value] of map) {
        if(value > 1) {
            console.log(key + " = " + value);
        }
    }
}

function colorPaths() {
    const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "black", "white"];
    let j = 0;
    for (let [key, value] of paths) {
        if(value > 1) {
            let elements = findThePath(key);
            for(let i = 0; i < elements.length; i++) {
                elements[i].style.backgroundColor = colors[j];
            }
            j++;
            if(j == colors.length) {
                j = 0;
            }
        }
    }
}

getPaths();
eliminatePaths();
printMap(paths);
colorPaths();