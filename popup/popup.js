document.getElementById("submitWord").addEventListener("click", filter);

document.addEventListener("DOMContentLoaded", function () {
    displayFilteredWords();
});

document.getElementById("clearList").addEventListener("click", function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: "clear_filtered_words" }, function(response) {
            alert(response.message);
        });
    });
    chrome.storage.local.clear();
    location.reload();
});

function filter() {
    var filteredWord = document.getElementById("filteredWord").value;

    //check if value is empty
    if (filteredWord == "") {
        alert("Please enter a word to filter");
        return;
    }
    saveFilteredWord(filteredWord);
    // send a message to the content script with the filtered word
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "filter", word: filteredWord}, function(response) {
            alert(response.message);
        });
    }); 

    // clear the input field
    document.getElementById("filteredWord").value = "";
} 

// Save filtered word to local storage
function saveFilteredWord(filteredWord) {
    chrome.storage.local.get(["filteredWords"], function(result) {
        let filteredWords = result.filteredWords || [];
        if(filteredWords.includes(filteredWord)){
            return;
        }

        filteredWords.push(filteredWord);
        chrome.storage.local.set({ "filteredWords": filteredWords }, function() {
            console.log(filteredWord + " saved to local storage.");
            displayFilteredWords();
        });
        
    });
}

// Get filtered words from local storage and display them in the UI
function displayFilteredWords() {
    chrome.storage.local.get(["filteredWords"], function(result) {
        let filteredWords = result.filteredWords || [];
        let filteredWordsList = document.getElementById("filtered-words-list");
        for (let i = 0; i < filteredWords.length; i++) {
            let filteredWord = filteredWords[i];
            let filteredWordItem = document.createElement("li");
            filteredWordItem.textContent = filteredWord;
            filteredWordsList.appendChild(filteredWordItem);
        }
    });
}
