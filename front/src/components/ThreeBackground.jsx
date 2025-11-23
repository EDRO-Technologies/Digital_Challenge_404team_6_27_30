import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        // 1. Setup
        const scene = new THREE.Scene();
        // Прозрачный фон, чтобы видеть CSS-градиенты если нужно
        // scene.background = new THREE.Color('#F3F4F6'); 
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

        // 2. Объекты (Пока пусто, как просили, но добавим свет)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Для примера можно раскомментировать куб, чтобы убедиться что работает
        /*
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x0072CE });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        */

        camera.position.z = 5;

        // 3. Анимация
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Если есть объекты, вращаем их тут
            // if (cube) { cube.rotation.x += 0.01; cube.rotation.y += 0.01; }

            renderer.render(scene, camera);
        };
        animate();

        // 4. Ресайз
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // 5. Очистка
        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div 
            ref={mountRef} 
            className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-40"
            style={{ background: 'linear-gradient(to bottom right, #F3F4F6, #E5E7EB)' }}
        />
    );
};

export default ThreeBackground;