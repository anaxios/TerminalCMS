// TODO figure out a better way than to use .keyup
$(document).keyup( function (event) {
    event.preventDefault(); // stop default key responses so console input will work particularly backspace.
     var textBoxString = $("#textBoxInputElement").val().toUpperCase();
    
    // submit console input
    if (event.which == 13) {
        changeURL(textBoxString);
        $("#textBox").html(""); // reset console input
        $("#textBoxInputElement").val(""); // reset hidden text input box
    }
    // update console text with hidden text input value 
    else {
        $("#textBox").text(textBoxString);
    }
});

// url update event actually changes page content this just triggers the url to update
function changeURL(textBoxString) {
    // set url hash
    window.location.hash = textBoxString; 
}

// actually update the content
function updateContent() {
    var textBoxString = window.location.hash;

    // check for and remove "#" from url hash
    var hash = /^[#]/;
    if (textBoxString.match(hash)){
        textBoxString = textBoxString.substring(1); // remove beginning hash
    }

    // get file and update content
    $.ajax("md/" + textBoxString.toUpperCase().trim() + ".md").done(function(data){
        var toHtml = mdConverter.makeHtml(data);
        $("#content").html(toHtml);
    })
    .fail(function(){
        $("#content").html("illegal operation");
    });
}