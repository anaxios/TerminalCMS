// animate the vestigal cursor caret thing
setInterval (function(){
    $(".blink").animate({opacity:0}, 300);
    $(".blink").animate({opacity:1}, 50);
}, 850);