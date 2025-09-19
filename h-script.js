const slides = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".indicator a");

function setActiveSlide() {
    let index = slides.length;

    while (--index && window.scrollY + 100 < slides[index].offsetTop) {}

    slides.forEach(s => s.classList.remove("active"));
    navLinks.forEach(l => l.classList.remove("active"));

    slides[index].classList.add("active");
    navLinks[index].classList.add("active");
}

setActiveSlide();
window.addEventListener("scroll", setActiveSlide);