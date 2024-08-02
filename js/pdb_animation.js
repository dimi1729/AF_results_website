////////////// IMPORTS
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js';
import { run_two_uniprots } from './eventHandler.js';
////////////// IMPORTS

let viewer, controls, scene, camera, renderer, downloadLink;

export function loadPDB(fileId) {
    const pdbUrl = `http://127.0.0.1:5000/get_pdb/${fileId}`;
    console.log("Loading PDB file:", pdbUrl);
    jQuery.ajax({
        url: pdbUrl,
        method: 'GET',
        success: function(data) {
            console.log("PDB file loaded successfully", data);
            showViewer();
            viewer.clear();
            try {
                if (typeof data !== 'string') {
                    console.error("Invalid PDB data format");
                    return;
                }

                const model = viewer.addModel(data, "pdb");

                const chains = model.selectedAtoms({}).map(atom => atom.chain).filter((value, index, self) => self.indexOf(value) === index);

                const colors = ['red', 'blue'];
                chains.forEach((chain, index) => {
                    viewer.setStyle({ chain: chain }, { cartoon: { color: colors[index % colors.length] } });
                });

                viewer.zoomTo();
                viewer.render();

                updateDownloadLink(pdbUrl);
            } catch (error) {
                console.error("Error rendering PDB model:", error);
            }
        },
        error: function(xhr, status, error) {
            console.error("Failed to load PDB file:", status, error);
        }
    });
}

function updateDownloadLink(pdbFile) {
    const downloadLink = document.getElementById('download-link');
    downloadLink.href = pdbFile;
    downloadLink.style.display = 'block';
}

function showViewer() {
    const viewer = document.getElementById('viewer');
    viewer.style.display = 'block';
}

function resetCamera() {
    camera.position.set(0, 0, 5);
    camera.rotation.set(0, 0, 0);
    controls.update();
}

let currentShape;
export async function updatePDB(uniprot1, uniprot2) {
    if (currentShape) {
        scene.remove(currentShape);
    }

    let pdb_path_1 = 'pdbs/' + uniprot1 + "_" + uniprot2 + ".pdb";
    let pdb_path_2 = 'pdbs/' + uniprot2 + "_" + uniprot1 + ".pdb";

    console.log("Attempting to load PDB files:", pdb_path_1, pdb_path_2);

    if (await fileExists(pdb_path_1)) {
        loadPDB(pdb_path_1);
    } else if (await fileExists(pdb_path_2)) {
        loadPDB(pdb_path_2);
    } else {
        console.error("Neither PDB file exists:", pdb_path_1, pdb_path_2);
    }

    resetCamera();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

export function init() {
    // Scene setup
    scene = new THREE.Scene();

    const viewerElement = document.getElementById('viewer');
    const viewerWidth = viewerElement.clientWidth;
    const viewerHeight = viewerElement.clientHeight;

    camera = new THREE.PerspectiveCamera(
        75,
        viewerWidth / viewerHeight,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewerWidth, viewerHeight);
    viewerElement.appendChild(renderer.domElement);

    renderer.setClearColor(0xaaaaaa);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    window.addEventListener('resize', () => {
        const newViewerWidth = viewerElement.clientWidth;
        const newViewerHeight = viewerElement.clientHeight;

        camera.aspect = newViewerWidth / newViewerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newViewerWidth, newViewerHeight);
    });

    viewer = $3Dmol.createViewer("viewer", {
        defaultcolors: $3Dmol.rasmolElementColors
    });

    downloadLink = document.getElementById('download-link');

    animate();

    const go_button = document.getElementById('go-button');
    go_button.addEventListener('click', run_two_uniprots);
}
