/**
 * @fileoverview High-performance Three.js WebGL viewport for 3D molecular and geometric rendering.
 * Supports OrbitControls (rotate, pan, zoom) and preset educational assets.
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Preset educational asset configurations
const PRESETS = {
    methane: {
        type: 'molecule',
        atoms: [
            { position: [0, 0, 0], color: 0x000000, radius: 0.4, name: 'Carbon' }, // Black/Dark Gray
            { position: [0.6, 0.6, 0.6], color: 0xFFFFFF, radius: 0.25, name: 'Hydrogen' },
            { position: [-0.6, -0.6, 0.6], color: 0xFFFFFF, radius: 0.25, name: 'Hydrogen' },
            { position: [0.6, -0.6, -0.6], color: 0xFFFFFF, radius: 0.25, name: 'Hydrogen' },
            { position: [-0.6, 0.6, -0.6], color: 0xFFFFFF, radius: 0.25, name: 'Hydrogen' },
        ],
        bonds: [
            [[0, 0, 0], [0.6, 0.6, 0.6]],
            [[0, 0, 0], [-0.6, -0.6, 0.6]],
            [[0, 0, 0], [0.6, -0.6, -0.6]],
            [[0, 0, 0], [-0.6, 0.6, -0.6]],
        ]
    },
    tetrahedron: {
        type: 'geometry',
        geometry: 'tetrahedron',
        color: 0x3B82F6,
        wireframe: true
    }
};

const ThreeDViewer = ({ preset = 'methane', width = '100%', height = '400px' }) => {
    const mountRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf3f4f6); // Light gray default

        // Check dark mode
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            scene.background = new THREE.Color(0x111827); // Dark gray
        }

        // Camera setup
        const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 2, 4);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Object creation based on preset
        const group = new THREE.Group();
        const config = PRESETS[preset] || PRESETS.methane;

        if (config.type === 'molecule') {
            // Create atoms
            config.atoms.forEach(atom => {
                const geometry = new THREE.SphereGeometry(atom.radius, 32, 32);
                const material = new THREE.MeshStandardMaterial({
                    color: atom.color,
                    roughness: 0.3,
                    metalness: 0.2
                });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(...atom.position);
                group.add(sphere);
            });

            // Create bonds
            config.bonds.forEach(bond => {
                const start = new THREE.Vector3(...bond[0]);
                const end = new THREE.Vector3(...bond[1]);
                const distance = start.distanceTo(end);

                const geometry = new THREE.CylinderGeometry(0.08, 0.08, distance, 16);
                const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                const cylinder = new THREE.Mesh(geometry, material);

                // Position and rotate cylinder to connect atoms
                const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                cylinder.position.copy(midpoint);
                cylinder.lookAt(end);
                cylinder.rotateX(Math.PI / 2); // Cylinder default is Y-up, rotate to Z-up

                group.add(cylinder);
            });
        } else if (config.type === 'geometry') {
            const geometry = new THREE.TetrahedronGeometry(1.5, 0);
            const material = new THREE.MeshStandardMaterial({
                color: config.color,
                wireframe: config.wireframe,
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
        }

        scene.add(group);
        setIsLoading(false);

        // Animation loop
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            controls.dispose();
            renderer.dispose();
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            // Dispose geometries and materials
            group.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        };
    }, [preset]);

    return (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-inner" style={{ width, height }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading 3D Model...</span>
                    </div>
                </div>
            )}
            <div ref={mountRef} className="w-full h-full cursor-move" />
            <div className="absolute bottom-3 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 pointer-events-none">
                Left Click: Rotate • Right Click: Pan • Scroll: Zoom
            </div>
        </div>
    );
};

export default ThreeDViewer;
