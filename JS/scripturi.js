// scripturi.js - Cleaned & Combined Functionality

// Universal Image Modal Functionality
function initUniversalImageModal() {
    const categoryCards = document.querySelectorAll('.category-card');
    const doorCards = document.querySelectorAll('.door-card');

    const modal = document.getElementById('image-modal');
    if (!modal) return;

    const modalImg = modal.querySelector('.modal-img');
    const closeModal = modal.querySelector('.close-modal');
    const modalDoorType = modal.querySelector('.modal-door-type');
    const modalDoorLocation = modal.querySelector('.modal-door-location');

    // Handle category cards
    categoryCards.forEach(card => {
        const img = card.querySelector('img');
        const title = card.querySelector('h3')?.textContent || '';

        if (img) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function (e) {
                e.preventDefault();
                modalImg.src = this.src;
                modalImg.alt = this.alt;
                if (modalDoorType) modalDoorType.textContent = title;
                if (modalDoorLocation) modalDoorLocation.textContent = '';
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    // Handle door cards
    doorCards.forEach(card => {
        const img = card.querySelector('.door-image');
        const type = card.querySelector('.door-type')?.textContent || '';
        const location = card.querySelector('.door-location')?.textContent || '';

        if (img) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function (e) {
                e.preventDefault();
                modalImg.src = this.src;
                modalImg.alt = this.alt;
                if (modalDoorType) modalDoorType.textContent = type;
                if (modalDoorLocation) modalDoorLocation.textContent = location;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    // Modal close handlers
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Hamburger Menu Functionality
function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            hamburger?.classList.remove('active');
            navLinks?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Close on resize (desktop)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            hamburger?.classList.remove('active');
            navLinks?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// Animated Counters
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    let hasAnimated = false;

    const observerOptions = {
        root: null,
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.animated) {
                animateCounter(entry.target);
                entry.target.animated = true;
                hasAnimated = true;
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counter.animated = false;
        observer.observe(counter);
    });

    // Fallback for browsers without IntersectionObserver
    if (!window.IntersectionObserver) {
        window.addEventListener('scroll', checkCountersVisibility);
    }

    function animateCounter(counter) {
        const target = +counter.getAttribute('data-target');
        const duration = 1800;
        let startTimestamp = null;

        const updateCounter = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            counter.textContent = Math.floor(progress * target).toLocaleString('ro-RO');
            if (progress < 1) requestAnimationFrame(updateCounter);
        };
        requestAnimationFrame(updateCounter);
    }

    function checkCountersVisibility() {
        if (hasAnimated) return;
        counters.forEach(counter => {
            if (!counter.animated && isElementInViewport(counter)) {
                animateCounter(counter);
                counter.animated = true;
            }
        });
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }
}

// 3D Model Viewer (requires GLTFLoader to be loaded separately)
async function init3DViewer() {
    const container = document.getElementById('door-container');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading-message">Loading 3D model...</div>';

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 3;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const loader = new THREE.GLTFLoader();
        const model = await loader.loadAsync('../models/door.glb');

        const box = new THREE.Box3().setFromObject(model.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const pivot = new THREE.Group();
        scene.add(pivot);
        model.scene.position.sub(center);
        pivot.add(model.scene);

        const scale = 2.5 / Math.max(size.x, size.y, size.z);
        pivot.scale.set(scale, scale, scale);

        let isDragging = false;
        let previousPosition = { x: 0, y: 0 };
        const rotationSpeed = 0.005;

        // Touch Controls
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                previousPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            const current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            pivot.rotation.y += (current.x - previousPosition.x) * rotationSpeed;
            pivot.rotation.x += (current.y - previousPosition.y) * rotationSpeed;
            previousPosition = current;
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => isDragging = false);

        // Mouse Controls
        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousPosition = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        });

        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mouseleave', () => isDragging = false);

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - previousPosition.x;
            const deltaY = e.clientY - previousPosition.y;
            pivot.rotation.y += deltaX * rotationSpeed;
            pivot.rotation.x += deltaY * rotationSpeed;
            previousPosition = { x: e.clientX, y: e.clientY };
        });

        document.getElementById('reset-view')?.addEventListener('click', () => {
            pivot.rotation.set(0, 0, 0);
        });

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();

    } catch (error) {
        console.error('Error loading 3D model:', error);
        container.innerHTML = `
            <div class="error-message">
                Failed to load 3D model.
                <img src="../images/fallback-door.jpg" alt="Door installation" style="max-width:100%">
            </div>
        `;
    }
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    initHamburgerMenu();
    initCounters();
    initUniversalImageModal();
    if (document.getElementById('door-container')) {
        init3DViewer();
    }
});
