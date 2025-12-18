// GSAP and Anime.js Animations
// Register GSAP plugins defensively (pages may not include all plugins)
if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}
if (typeof TextPlugin !== 'undefined') {
    gsap.registerPlugin(TextPlugin);
}

// ===== THEME TOGGLE =====
function applyTheme(theme) {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const icon = toggle ? toggle.querySelector('.toggle-icon') : null;

    body.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {
        // ignore storage errors
    }

    if (toggle) {
        toggle.classList.toggle('active', theme === 'light');
    }

    if (icon) {
        anime({
            targets: icon,
            left: theme === 'light' ? '27px' : '3px',
            background: theme === 'light' ? 'var(--gradient-secondary)' : 'var(--gradient-primary)',
            duration: 300,
            easing: 'easeOutExpo'
        });
    }
}

function initTheme() {
    let saved = 'dark';
    try {
        const val = localStorage.getItem('theme');
        if (val === 'light' || val === 'dark') saved = val;
    } catch (e) {
        // ignore
    }

    // Apply saved or default theme immediately
    document.body.setAttribute('data-theme', saved);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.classList.toggle('active', saved === 'light');
        toggle.addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme first so variables are correct
    initTheme();
    // Check if we just navigated here (show arrival animation)
    if (window.location.hash === '#transition') {
        showTerminalArrival();

        // Clean up URL without refreshing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }

    initNavigation();

    // Trigger animations based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        initParticles();
        initHomeAnimations();
        initScrollAnimations();
        initScrollIndicator();
    } else if (currentPage === 'cv.html') {
        animateCV();
    } else if (currentPage === 'projects.html') {
        animateProjects();
    } else if (currentPage === 'contact.html') {
        animateContact();
        initFormValidation();
    }

    // Show terminal loading on navigation links
    initTerminalTransition();
});

// ===== NAVIGATION =====
function initNavigation() {
    // Set active link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    const nav = document.querySelector('.nav');
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.getElementById('navToggle');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Mobile hamburger toggle
    if (nav && navMenu && navToggle) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = !nav.classList.contains('open');
            nav.classList.toggle('open', willOpen);
            navToggle.setAttribute('aria-expanded', String(willOpen));

            // Simple slide animation for dropdown menu
            if (willOpen) {
                anime({
                    targets: navMenu,
                    translateY: [-10, 0],
                    opacity: [0, 1],
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            }
        });

        // Close menu when clicking any nav link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('open')) {
                    nav.classList.remove('open');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && nav.classList.contains('open')) {
                nav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Reset menu on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && nav.classList.contains('open')) {
                nav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// ===== TERMINAL LOADING TRANSITION =====
function initTerminalTransition() {
    const pageTransition = document.querySelector('.page-transition');
    const terminalLines = document.querySelectorAll('.terminal-line');
    const pageDestination = document.getElementById('page-destination');

    if (!pageTransition) return;

    function navigateWithTransition(href) {
        if (!href) return;

        // sanitize href by removing any existing hash
        if (href.includes('#')) href = href.split('#')[0];

        const pageName = href.replace('.html', '').replace('index', 'home');

        terminalLines.forEach(line => { line.style.opacity = '0'; });
        if (pageDestination) pageDestination.textContent = pageName;

        pageTransition.classList.add('active');
        anime({
            targets: '.page-transition',
            opacity: [0, 1],
            duration: 200,
            easing: 'linear',
            complete: () => {
                anime.timeline()
                    .add({
                        targets: terminalLines[0],
                        opacity: [0, 1],
                        translateY: [-10, 0],
                        duration: 300,
                        easing: 'easeOutQuad'
                    })
                    .add({
                        targets: terminalLines[1],
                        opacity: [0, 1],
                        translateY: [-10, 0],
                        duration: 300,
                        easing: 'easeOutQuad',
                        complete: () => {
                            setTimeout(() => {
                                window.location.href = href + '#transition';
                            }, 600);
                        }
                    }, '-=100');
            }
        });
    }

    // Intercept all internal anchor clicks (not just nav links)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        let href = link.getAttribute('href');

        // External or non-navigation links
        if (!href) return;
        const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:');
        const isHash = href.startsWith('#');
        const opensNewTab = link.target === '_blank';
        if (isExternal || isHash || opensNewTab) return;

        // Only handle internal page navigations like *.html
        const isInternalHtml = /\.html($|#|\?)/.test(href);
        if (!isInternalHtml) return;

        // Avoid animating when clicking current page link
        if (link.classList && link.classList.contains('active')) return;

        e.preventDefault();
        navigateWithTransition(href);
    });

    // Expose for other handlers to reuse
    window.navigateWithTransition = navigateWithTransition;
}

// Show terminal animation when arriving at a page
function showTerminalArrival() {
    const pageTransition = document.querySelector('.page-transition');
    const terminalLines = document.querySelectorAll('.terminal-line');
    const pageDestination = document.getElementById('page-destination');

    if (!pageTransition) return;

    // Set current page name
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = currentPage.replace('.html', '').replace('index', 'home');
    if (pageDestination) {
        pageDestination.textContent = pageName;
    }

    // Start with overlay visible and lines hidden
    pageTransition.classList.add('active');
    pageTransition.style.opacity = '1';
    terminalLines.forEach(line => {
        line.style.opacity = '0';
    });

    // Animate terminal lines appearing (same as departure)
    anime.timeline()
        .add({
            targets: terminalLines[0],
            opacity: [0, 1],
            translateY: [-10, 0],
            duration: 300,
            easing: 'easeOutQuad'
        })
        .add({
            targets: terminalLines[1],
            opacity: [0, 1],
            translateY: [-10, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                // After showing the terminal animation, fade out
                setTimeout(() => {
                    anime({
                        targets: '.page-transition',
                        opacity: [1, 0],
                        duration: 400,
                        easing: 'easeOutQuad',
                        complete: () => {
                            pageTransition.classList.remove('active');
                            // Reset terminal lines for next transition
                            terminalLines.forEach(line => {
                                line.style.opacity = '0';
                            });
                        }
                    });
                }, 500);
            }
        }, '-=100');
}

// ===== PARTICLES ANIMATION (Anime.js) =====
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particlesContainer.appendChild(particle);
    }

    // Animate particles with Anime.js
    anime({
        targets: '.particle',
        translateX: () => anime.random(-100, 100),
        translateY: () => anime.random(-100, 100),
        scale: () => anime.random(0.5, 2),
        opacity: [
            { value: 0.5, duration: 1000 },
            { value: 0.1, duration: 1000 }
        ],
        duration: () => anime.random(3000, 6000),
        easing: 'easeInOutSine',
        loop: true,
        delay: anime.stagger(50)
    });
}

// ===== HOME PAGE ANIMATIONS =====
function initHomeAnimations() {
    // Typewriter effect for role using GSAP
    const roles = [
        'Front-End Developer',
        'Computer Science Student',
        'Security Enthusiast',
        'Problem Solver'
    ];

    let currentRole = 0;

    function typeRole() {
        gsap.to('#typedRole', {
            duration: 2,
            text: roles[currentRole],
            ease: 'none',
            onComplete: () => {
                setTimeout(() => {
                    currentRole = (currentRole + 1) % roles.length;
                    gsap.to('#typedRole', {
                        duration: 1,
                        text: '',
                        ease: 'none',
                        onComplete: typeRole
                    });
                }, 2000);
            }
        });
    }

    typeRole();

    // Animate hero elements
    gsap.from('.hello', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.2
    });

    gsap.from('.name', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.4
    });

    gsap.from('.hero-description', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.8
    });

    // Removed fade-in animation for hero buttons

    // Code window animation (desktop only to avoid overflow on mobile)
    if (window.innerWidth > 768) {
        gsap.from('.code-window', {
            x: 100,
            rotateY: -15,
            duration: 1,
            delay: 0.5,
            ease: 'power3.out'
        });
    } else {
        // Ensure no transform is applied on mobile
        const cw = document.querySelector('.code-window');
        if (cw) {
            cw.style.transform = 'none';
        }
    }

    // Animate code lines with Anime.js
    anime({
        targets: '.code-content code',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 100,
        delay: 120,
        easing: 'easeOutExpo'
    });

    // Button hover effects with Anime.js
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            anime({
                targets: btn.querySelector('.btn-bg'),
                scale: 1.1,
                duration: 30,
                easing: 'easeOutExpo'
            });
        });

        btn.addEventListener('mouseleave', () => {
            anime({
                targets: btn.querySelector('.btn-bg'),
                scale: 1,
                duration: 300,
                easing: 'easeOutExpo'
            });
        });
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    gsap.from('.scroll-indicator', {
        opacity: 0,
        y: -20,
        duration: 1,
        delay: 1.5
    });
}

// ===== SCROLL INDICATOR =====
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.style.cursor = 'pointer';
        scrollIndicator.addEventListener('click', () => {
            if (typeof window.navigateWithTransition === 'function') {
                window.navigateWithTransition('cv.html');
            } else {
                window.location.href = 'cv.html';
            }
        });
    }
}

// ===== CV PAGE ANIMATIONS =====
function animateCV() {
    // Animate page title
    anime({
        targets: '.page-title',
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 800,
        easing: 'easeOutExpo'
    });

    // Timeline animation
    gsap.from('.timeline-item', {
        opacity: 0,
        x: -50,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
            trigger: '.timeline',
            start: 'top 80%'
        }
    });

    // Skill bars animation
    document.querySelectorAll('.skill-bar').forEach((bar, index) => {
        const progress = bar.getAttribute('data-progress');
        const fill = bar.querySelector('.skill-fill');

        gsap.to(fill, {
            width: progress + '%',
            duration: 1.5,
            delay: index * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: bar,
                start: 'top 90%'
            }
        });
    });

    // Animate skill badges with Anime.js
    anime({
        targets: '.skill-badge',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(50),
        easing: 'easeOutElastic(1, .8)'
    });

    // Certification cards animation
    anime({
        targets: '.cert-card',
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(100),
        easing: 'easeOutExpo'
    });

    // Add floating animation to cert cards
    anime({
        targets: '.cert-card',
        translateY: [-5, 5],
        duration: 2000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        delay: anime.stagger(200)
    });
}

// ===== PROJECTS PAGE ANIMATIONS =====
function animateProjects() {
    // Animate page title
    anime({
        targets: '.page-title',
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 800,
        easing: 'easeOutExpo'
    });

    // Project cards with stagger
    anime({
        targets: '.project-card',
        translateY: [80, 0],
        opacity: [0, 1],
        duration: 1000,
        delay: anime.stagger(150),
        easing: 'easeOutExpo'
    });

    // Animate project images on hover
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            anime({
                targets: card.querySelector('.project-bg'),
                scale: 1.15,
                duration: 600,
                easing: 'easeOutExpo'
            });
        });

        card.addEventListener('mouseleave', () => {
            anime({
                targets: card.querySelector('.project-bg'),
                scale: 1,
                duration: 600,
                easing: 'easeOutExpo'
            });
        });
    });

    // Tech tags animation
    anime({
        targets: '.tech-tag',
        scale: [0, 1],
        rotate: [180, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(30, { start: 500 }),
        easing: 'easeOutElastic(1, .6)'
    });
}

// ===== CONTACT PAGE ANIMATIONS =====
function animateContact() {
    // Animate page title
    anime({
        targets: '.page-title',
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 800,
        easing: 'easeOutExpo'
    });

    // Contact info animation
    gsap.from('.contact-info h3, .contact-info > p', {
        opacity: 0,
        x: -50,
        duration: 0.8,
        stagger: 0.2
    });

    // Contact items with Anime.js
    anime({
        targets: '.contact-item',
        translateX: [-50, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(100),
        easing: 'easeOutExpo'
    });

    // Social links animation
    anime({
        targets: '.social-link',
        scale: [0, 1],
        rotate: [180, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(100, { start: 400 }),
        easing: 'easeOutElastic(1, .8)'
    });

    // Form animation
    gsap.from('.form-group', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.15,
        delay: 0.3
    });

    // Form input focus animations
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
        input.addEventListener('focus', () => {
            anime({
                targets: input.parentElement.querySelector('.form-line'),
                width: '100%',
                duration: 400,
                easing: 'easeOutExpo'
            });
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                anime({
                    targets: input.parentElement.querySelector('.form-line'),
                    width: '0%',
                    duration: 400,
                    easing: 'easeOutExpo'
                });
            }
        });
    });
}

// ===== FORM VALIDATION =====
function initFormValidation() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        // Simple validation
        if (name && email && message) {
            // Success animation
            anime({
                targets: '.submit-btn',
                scale: [1, 0.95, 1.05, 1],
                duration: 600,
                easing: 'easeOutElastic(1, .6)',
                complete: () => {
                    // Show success message (in a real app, this would send the data)
                    alert('Thank you for your message! I will get back to you soon.');
                    form.reset();
                }
            });
        } else {
            // Error animation
            anime({
                targets: '.submit-btn',
                translateX: [
                    { value: -10, duration: 100 },
                    { value: 10, duration: 100 },
                    { value: -10, duration: 100 },
                    { value: 10, duration: 100 },
                    { value: 0, duration: 100 }
                ],
                easing: 'easeInOutSine'
            });
        }
    });
}

// ===== ADDITIONAL INTERACTIVE EFFECTS =====

// Nav logo animation
anime({
    targets: '.nav-logo .bracket',
    color: [
        { value: '#00d9ff' },
        { value: '#bd00ff' },
        { value: '#ff006e' },
        { value: '#00d9ff' }
    ],
    duration: 4000,
    loop: true,
    easing: 'linear'
});

// Continuous glow animation for timeline dots
anime({
    targets: '.timeline-dot',
    boxShadow: [
        { value: '0 0 20px #00d9ff' },
        { value: '0 0 40px #00d9ff' },
        { value: '0 0 20px #00d9ff' }
    ],
    duration: 2000,
    loop: true,
    easing: 'easeInOutSine'
});

// Mouse tracking for parallax effect on code window
document.addEventListener('mousemove', (e) => {
    const codeWindow = document.querySelector('.code-window');
    if (!codeWindow) return;
    // Skip parallax on small screens to prevent overflow/misalignment
    if (window.innerWidth <= 768) return;

    const rect = codeWindow.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateY = (x / rect.width) * 10;
    const rotateX = -(y / rect.height) * 10;

    gsap.to(codeWindow, {
        rotateY: rotateY,
        rotateX: rotateX,
        duration: 0.5,
        ease: 'power2.out'
    });
});

// Reset code window transform when resizing to mobile
window.addEventListener('resize', () => {
    const cw = document.querySelector('.code-window');
    if (!cw) return;
    if (window.innerWidth <= 768) {
        // Clear GSAP-applied transform inline style
        try { gsap.set(cw, { clearProps: 'transform' }); } catch (e) { /* ignore */ }
        cw.style.transform = 'none';
    }
});

// Skill badge hover effect
document.querySelectorAll('.skill-badge').forEach(badge => {
    badge.addEventListener('mouseenter', () => {
        anime({
            targets: badge,
            translateY: -5,
            scale: 1.05,
            duration: 300,
            easing: 'easeOutExpo'
        });
    });

    badge.addEventListener('mouseleave', () => {
        anime({
            targets: badge,
            translateY: 0,
            scale: 1,
            duration: 300,
            easing: 'easeOutExpo'
        });
    });
});

// Contact item hover effect enhancement
document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        anime({
            targets: item.querySelector('.contact-icon'),
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
            duration: 600,
            easing: 'easeOutElastic(1, .6)'
        });
    });
});
