// rotate.js - Corrected 3D Model Viewer with Proper Rotation Center
document.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE === 'undefined') {
        showError('Three.js library not loaded. Please include Three.js first.');
        return;
    }
    initModelViewer();
});

function showError(message) {
    const container = document.getElementById('door-container');
    if (container) {
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
    console.error(message);
}

async function initModelViewer() {
    const container = document.getElementById('door-container');
    if (!container) {
        showError('Container element not found');
        return;
    }

    // Show loading message
    container.innerHTML = '<div class="loading-message">Loading 3D model...</div>';

    try {
        // 1. Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        // 2. Set up camera
        const camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 3;

        // 3. Create renderer
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // 4. Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // 5. Load 3D model
        const loader = new THREE.GLTFLoader();
        const model = await loader.loadAsync('../models/door.glb');
        
        // 6. Calculate bounding box and center
        const box = new THREE.Box3().setFromObject(model.scene);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());

        // 7. Create pivot group and center the model
        const pivot = new THREE.Group();
        scene.add(pivot);
        
        // Offset the model so its center is at (0,0,0)
        model.scene.position.sub(center);
        pivot.add(model.scene);

        // 8. Scale the model appropriately
        const scale = 2.5 / Math.max(size.x, size.y, size.z);
        pivot.scale.set(scale, scale, scale);

        // 9. Set up rotation controls for the PIVOT group
        let isDragging = false;
        let previousPosition = { x: 0, y: 0 };
        const rotationSpeed = 0.005;

        function onPointerStart(e) {
            isDragging = true;
            previousPosition = getPointerPosition(e);
            e.preventDefault();
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            
            const currentPosition = getPointerPosition(e);
            const deltaX = currentPosition.x - previousPosition.x;
            const deltaY = currentPosition.y - previousPosition.y;
            
            // Rotate the PIVOT group, not modelGroup
            pivot.rotation.y += deltaX * rotationSpeed;
            pivot.rotation.x += deltaY * rotationSpeed;
            
            previousPosition = currentPosition;
            e.preventDefault();
        }

        function onPointerEnd() {
            isDragging = false;
        }

        function getPointerPosition(e) {
            return {
                x: e.touches ? e.touches[0].clientX : e.clientX,
                y: e.touches ? e.touches[0].clientY : e.clientY
            };
        }

        // Add event listeners
        container.addEventListener('mousedown', onPointerStart);
        container.addEventListener('touchstart', onPointerStart);
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerEnd);
        document.addEventListener('touchend', onPointerEnd);

        // 10. Reset view button - resets the PIVOT rotation
        const resetBtn = document.getElementById('reset-view');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                pivot.rotation.set(0, 0, 0);
            });
        }

        // 11. Animation loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();

        // 12. Handle window resize
        window.addEventListener('resize', function() {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

    } catch (error) {
        console.error('Error loading 3D model:', error);
        showError('Failed to load 3D model. Please try again later.');
        
        // Fallback cube if model fails to load
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        scene.add(new THREE.Mesh(geometry, material));
    }
}