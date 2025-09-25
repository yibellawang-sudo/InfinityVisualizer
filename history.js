document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.scrollIntroView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

//Make video showing off project
//write project description