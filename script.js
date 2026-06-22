window.onload = function() {
    // Three.js Scene Setup
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // 1. Load the user's 3D Face/Head Model
    const loader = new THREE.GLTFLoader();
    
    // Create a cool wireframe placeholder while the model loads
    const fallbackGeo = new THREE.IcosahedronGeometry(4, 2);
    const fallbackMat = new THREE.MeshStandardMaterial({ 
        color: 0x8b5cf6, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
    avatarGroup.add(fallbackMesh);

    // Load the model (assumes the file is named 'model.glb' and uploaded to the workspace)
    const modelUrl = 'model.glb'; // REPLACE THIS WITH YOUR HOSTED .glb URL
    
    if (modelUrl !== 'model.glb') {
        try {
            loader.load(
                modelUrl, 
                function (gltf) {
                    // Remove the placeholder
                    avatarGroup.remove(fallbackMesh);
                    
                    const model = gltf.scene;
                    
                    // Automatically center and scale the loaded model to fit the scene
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 8 / maxDim; // Scale to our scene's proportion
                    
                    model.scale.set(scale, scale, scale);
                    model.position.sub(center.multiplyScalar(scale)); // Center it
                    
                    // Give the model a futuristic material to match the portfolio
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xaaaaaa,
                                metalness: 0.8,
                                roughness: 0.2,
                                wireframe: false
                            });
                        }
                    });

                    avatarGroup.add(model);
                },
                undefined,
                function (error) {
                    console.error('Error loading the 3D model. Please ensure the URL is correct.', error);
                }
            );
        } catch (err) {
            console.error('Failed to execute model loading:', err);
        }
    } else {
        console.log("Using 3D placeholder. Replace 'modelUrl' with a valid hosted .glb URL to load your custom model.");
    }

    // 2. VR Glasses Prop
    const vrGroup = new THREE.Group();
    
    // Main headset body
    const vrGeo = new THREE.BoxGeometry(3.8, 1.4, 1.5);
    const vrMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    const vrMesh = new THREE.Mesh(vrGeo, vrMat);
    vrGroup.add(vrMesh);
    
    // Glowing Visor
    const visorGeo = new THREE.PlaneGeometry(3.6, 1.0);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan by default
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.z = 0.76; // Slightly in front of the headset
    vrGroup.add(visorMesh);

    // Strap wrapping behind head
    const strapGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.4, 32, 1, true, 0, Math.PI);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.rotation.x = Math.PI / 2;
    strapMesh.position.z = -0.5;
    vrGroup.add(strapMesh);

    // Position VR group initially high above the avatar's head
    vrGroup.position.set(0, 10, 0.5);
    avatarGroup.add(vrGroup);

    const updateAvatarPosition = () => {
        const isDesktop = window.innerWidth > 768;
        // Move avatar to the right on desktop, center on mobile
        avatarGroup.position.x = isDesktop ? 6 : 0;
    };
    updateAvatarPosition();

    // Props logic
    let targetVrY = 10;
    let targetAvatarScale = 1;
    const arVrCard = document.getElementById('ar-vr-card');

    const themeBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    let isColorful = false;

    themeBtn.addEventListener('click', () => {
        isColorful = !isColorful;
        document.body.classList.toggle('theme-colorful', isColorful);
        
        if (isColorful) {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }

        // Update 3D Materials for Colorful Theme
        if (isColorful) {
            scene.fog.color.setHex(0x070714);
            particlesMaterial.color.setHex(0xec4899); // Neon Pink
            visorMat.color.setHex(0xec4899); // Neon Pink Visor
        } else {
            scene.fog.color.setHex(0x000000);
            particlesMaterial.color.setHex(0xffffff);
            visorMat.color.setHex(0x00ffff); // Cyan Visor
        }
    });

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;
    });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        
        // Detect if AR/VR card is in view
        if (arVrCard) {
            const rect = arVrCard.getBoundingClientRect();
            // If the card is roughly in the middle of the screen
            const inView = (rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2);
            
            if (inView) {
                targetVrY = 2.6; // Drop down to eye level based on image structure
                targetAvatarScale = 1.1; // Scale up slightly to "react"
            } else {
                targetVrY = 10; // Send it back up out of frame
                targetAvatarScale = 1.0;
            }
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateAvatarPosition();
    });

    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse follow for camera
        targetX = mouseX * 0.5;
        targetY = mouseY * 0.5;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Avatar floating animation
        avatarGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.2;
        
        // Avatar scroll rotation (spins slowly as you scroll down)
        const targetRotationY = scrollY * 0.002 + mouseX * 0.5;
        avatarGroup.rotation.y += (targetRotationY - avatarGroup.rotation.y) * 0.1;

        // Animate VR Glasses position smoothly
        vrGroup.position.y += (targetVrY - vrGroup.position.y) * 0.1;
        
        // Animate Avatar Scale smoothly
        avatarGroup.scale.set(
            avatarGroup.scale.x + (targetAvatarScale - avatarGroup.scale.x) * 0.1,
            avatarGroup.scale.y + (targetAvatarScale - avatarGroup.scale.y) * 0.1,
            avatarGroup.scale.z + (targetAvatarScale - avatarGroup.scale.z) * 0.1
        );

        // Particles movement
        particlesMesh.rotation.y = elapsedTime * 0.05 + (mouseX * 0.5);
        particlesMesh.position.y = scrollY * 0.01; 

        renderer.render(scene, camera);
    }

    animate();
};