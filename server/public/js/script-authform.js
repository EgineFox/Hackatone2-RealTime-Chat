const signInBtn = document.querySelector("#signInButton");
const signUpBtn = document.querySelector("#signUpButton");

const signInForm = document.querySelector(".container .sign-in-form");
const signUpForm = document.querySelector(".container .sign-up-form");

const overlayContainer = document.querySelector(
  ".container .overlay-container"
);
const overlay = document.querySelector( ".container .overlay-container .overlay");

signInBtn.addEventListener("click", ()=>{

    overlayContainer.style.transform = 'translateX(100%)';
    overlay.style.transform = 'translateX(-50%)';
    signInForm.classList.add('active');
    signUpForm.classList.remove('active');

});

signUpBtn.addEventListener("click", ()=>{

    overlayContainer.style.transform = 'translateX(0)';
    overlay.style.transform = 'translateX(-0)';
    signUpForm.classList.add('active');
    signInForm.classList.remove('active');

});

