

const Lbutton = document.getElementById("loading-button")
Lbutton.addEventListener('click', function () {
    LoadingState(Lbutton.id)    
});


// initiate loading state of button
export function LoadingState(id, button = Lbutton) {
    console.log(`here 1`)
    // call all children elements of our button
    // const button = document.getElementById(id);
    const childNodes = button.childNodes;
    console.log(childNodes)
    
    // assign each child to a variable
    // current convention is the first element (<i>) will be the loading symbol, 
    // and the second element (<span>) will be the button content
    const Licon = childNodes[1]
    const text = childNodes[3];

    // actually set the content to loading state
    Licon.style.display = "grid";
    text.style.display = "none";
    console.log(`button haha {Lbutton}`)

    

    setTimeout(function() {
        console.log(`resetting button loading state demo`)
        ResetButtonContent(Lbutton.id)
    }, 5000);
}


// this function resets any button from loading state back to static and ready
export function ResetButtonContent(id) {

    console.log(`here 2`)
    // call all children elements of our button
    const button = document.getElementById(id);
    const childNodes = button.childNodes;
    
    // assign each child to a variable
    // current convention is the first element (<i>) will be the loading symbol, 
    // and the second element (<span>) will be the button content
    // I have no clue why there's empty elements at index 1,3,and 5, so proceed with caution here. 
    const Licon = childNodes[1]
    const text = childNodes[3];

    // actually reset the content
    Licon.style.display = "none";
    text.style.display = "grid";
    console.log(`reset, button:{button}, Licon: {Licon}, text: {text}`);
}