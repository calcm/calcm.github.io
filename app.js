var history = [];
var counter = 0;

document.getElementById("submit").addEventListener('click', function() {
    document.getElementById("outputText").textContent = new MathExpression(document.getElementById("inputText").value).solve();
    history[counter] = document.getElementById("inputText").value;
    counter++;
    document.getElementById("inputText").value = "";
});

document.getElementById("inputText").addEventListener('keypress', function(e) {
    console.log(e.keyCode);
    if (e.keyCode == 13) {
        document.getElementById("submit").click();
    } else if (keyCode == 38) {
        document.getElementById("inputText").value = history[counter - 1];
    }
});

function insert(number) {
    document.getElementById("inputText").value += number;
}

function deleteLast() {
    document.getElementById("inputText").value = document.getElementById("inputText").value.substring(0, document.getElementById("inputText").value.length - 1);
}