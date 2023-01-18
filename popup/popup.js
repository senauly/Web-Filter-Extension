document.getElementById("submitWord").addEventListener("click", filter);

document.addEventListener("DOMContentLoaded", function () {
    displayFilteredWords();
    var filteredWordInput = document.getElementById("filteredWord");
    filteredWordInput.addEventListener("keydown", function (event) {
        if (event.code === 'Enter') {
            filter();
        }
    });

    chrome.storage.local.get(["learning_mode"], function (result) {
        if (result.learning_mode) {
            document.getElementById("stop-learning").className = "btn btn-warning";
            document.getElementById("learning-info").className = "row mt-2";
            document.getElementById("learning-mode").className = "d-none btn btn-success";
        }

        if(result.learning_mode == null || result.learning_mode == undefined){
            //set storage
            chrome.storage.local.set({ "learning_mode": false });
        }
    });

    chrome.storage.local.get(["blur"], function (result) {
        if (result.blur) {
            blurCheckbox.checked = true;
        }
    });
});

document.getElementById("learning-mode").addEventListener("click", function () {

    //ask user if they want to continue
    var r = confirm("Do you want to enable the learning mode?");
    if (r) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { message: "learning_mode" });
        });

        //set local storage
        chrome.storage.local.set({ "learning_mode": true });

        document.getElementById("stop-learning").className = "btn btn-warning";
        document.getElementById("learning-mode").className = "d-none btn btn-success";
        document.getElementById("learning-info").className = "row mt-2";
    }
});

//event handler for stop learning mode
document.getElementById("stop-learning").addEventListener("click", function () {
    var r = confirm("Do you want to disable the learning mode? Your selections will be saved.");

    if (r) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { message: "stop_learning_mode" });
        });

        chrome.storage.local.set({ "learning_mode": false });
        document.getElementById("stop-learning").className = "d-none btn btn-warning";
        document.getElementById("learning-mode").className = "btn btn-success";
        document.getElementById("learning-info").className = "d-none row mt-2";
    }

});

document.getElementById("clearList").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: "clear_filtered_words" });
    });

    chrome.storage.local.clear();
    location.reload();
    displayFilteredWords();
});

const blurCheckbox = document.getElementById("blur");

blurCheckbox.addEventListener("change", function () {
    if (blurCheckbox.checked) {
        //set local storage
        chrome.storage.local.set({ "blur": true });
    } else {
        //set local storage
        chrome.storage.local.set({ "blur": false });
    }
});


function filter() {
    var filteredWord = document.getElementById("filteredWord").value;

    //check if value is empty
    if (filteredWord == "") {
        return;
    }
    saveFilteredWord(filteredWord);
    // send a message to the content script with the filtered word
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: "filter", word: filteredWord });
    });

    // clear the input field
    document.getElementById("filteredWord").value = "";
}

// Save filtered word to local storage
function saveFilteredWord(filteredWord) {
    chrome.storage.local.get(["filteredWords"], function (result) {
        let filteredWords = result.filteredWords || [];
        if (filteredWords.includes(filteredWord)) {
            return;
        }

        filteredWords.push(filteredWord);
        chrome.storage.local.set({ "filteredWords": filteredWords }, function () {
            console.log(filteredWord + " saved to local storage.");
            displayFilteredWords();
        });

    });
}

function createFilteredWordElement(word) {
    let col = document.createElement("div");
    col.className = "col-4 p-1";

    let card = document.createElement('div');
    card.className = 'card';

    //card header with button
    let cardHeader = document.createElement('div');
    cardHeader.className = 'card-header d-flex justify-content-center';
    
    //create a text element
    let cardText = document.createElement('span');
    cardText.innerText = word.length > 20 ? word.substring(0, 20).toLowerCase() + "..." : word.toLowerCase();
    cardHeader.appendChild(cardText);

    let removeButton = document.createElement("button");
    removeButton.className = "btn-close";
    removeButton.setAttribute("aria-label", "Close");
    removeButton.type = "button";
    removeButton.addEventListener("click", function () {
        removeFilteredWord(word);
    });
    cardHeader.appendChild(removeButton);
    card.appendChild(cardHeader);

    col.appendChild(card);

    cardHeader.addEventListener("mouseover", function () {
        cardText.innerText = word.toLowerCase();
    });
    
    cardHeader.addEventListener("mouseout", function () {
        cardText.innerText = word.length > 20 ? word.substring(0, 20).toLowerCase() + "..." : word.toLowerCase();
    });
    
    return col;
}

function displayFilteredWords() {
    chrome.storage.local.get(["filteredWords"], function (result) {
        let filteredWords = result.filteredWords || [];
        let filteredWordsList = document.getElementById("filtered-words-list");
        filteredWordsList.innerHTML = "";
        let filteredWordsRow = document.createElement("div");
        filteredWordsRow.className = "row";
        for (let i = 0; i < filteredWords.length; i++) {
            let filteredWord = filteredWords[i];
            filteredWordsRow.appendChild(createFilteredWordElement(filteredWord));
            if ((i + 1) % 3 == 0) {
                filteredWordsList.appendChild(filteredWordsRow);
                filteredWordsRow = document.createElement("div");
                filteredWordsRow.classList.add("row");
            }
        }
        if (filteredWordsRow.children.length > 0) {
            filteredWordsList.appendChild(filteredWordsRow);
        }
    });
}


function removeFilteredWord(word) {
    chrome.storage.local.get(["filteredWords"], function (result) {
        let filteredWords = result.filteredWords || [];
        let index = filteredWords.indexOf(word);
        if (index !== -1) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { message: "add_back", word: word });
            });

            filteredWords.splice(index, 1);
            chrome.storage.local.set({ "filteredWords": filteredWords }, function () {
                console.log(word + " removed from local storage.");
                displayFilteredWords();
            });
        }
    });
}