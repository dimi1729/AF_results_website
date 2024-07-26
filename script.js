////////////////// IMPORT STATEMENTS
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js';

function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}

loadScript('https://code.jquery.com/jquery-3.6.0.min.js', () => {
    loadScript('https://3dmol.csb.pitt.edu/build/3Dmol-min.js', init);
});
////////////////// IMPORT STATEMENTS

let viewer;
let controls, scene, camera, renderer;
let downloadLink;

///////////////// INPUT PREP FUNCTIONS
function check_uniprot_is_valid(uniprot){
    return true;
}

function check_checkboxes_are_valid(checkboxList){
    return true;
}

function check_input_is_valid(uniprot1, uniprot2, checkboxList){
    let is_valid = true;

    if (check_uniprot_is_valid(uniprot1) == false){
        alert('The first Uniprot ' + uniprot1 + ' cannot be found in the list of human mitochondrial proteins');
        is_valid = false;
    }
    if (check_uniprot_is_valid(uniprot2) == false){
        alert('The second Uniprot ' + uniprot2 + ' cannot be found in the list of human mitochondrial proteins');
        is_valid = false;
    }
    if (check_checkboxes_are_valid(checkboxList) == false){
        alert('Please select at least one of the options for scores to see');
        is_valid = false;
    }

    return is_valid;
}

function loadPDB(pdbFile) {
    console.log("Loading PDB file:", pdbFile);
    jQuery.ajax({
        url: pdbFile,
        method: 'GET',
        success: function(data) {
            console.log("PDB file loaded successfully");
            viewer.clear();
            const model = viewer.addModel(data, "pdb");

            // Get all chains in the model
            const chains = model.selectedAtoms({}).map(atom => atom.chain).filter((value, index, self) => self.indexOf(value) === index);

            // Apply different styles to each chain
            const colors = ['red', 'blue']; // Add more colors if you have more than two chains
            chains.forEach((chain, index) => {
                viewer.setStyle({chain: chain}, {cartoon: {color: colors[index % colors.length]}});
            });

            viewer.zoomTo();
            viewer.render();

            // Update the download link
            updateDownloadLink(pdbFile);
        },
        error: function(xhr, status, error) {
            console.error("Failed to load PDB file:", status, error);
        }
    });
}

function updateDownloadLink(pdbFile) {
    const downloadLink = document.getElementById('download-link');
    downloadLink.href = pdbFile;
    downloadLink.style.display = 'block'; // Ensure the link is visible
}


function run_two_uniprots(event){
    event.preventDefault();

    const uniprot1 = document.getElementById('Uniprot1').value;
    const uniprot2 = document.getElementById('Uniprot2').value;

    const dena = document.getElementById('dena').checked;
    const iptm = document.getElementById('iptm').checked;
    const pDOCKq = document.getElementById('pDOCKq').checked;
    const ptm = document.getElementById('ptm').checked;
    const pae = document.getElementById('pae').checked;

    const checkboxList = [dena, iptm, pDOCKq, ptm, pae]

    if (check_input_is_valid(uniprot1, uniprot2, checkboxList) == false) return;

    updatePDB(uniprot1, uniprot2);
}
///////////////// INPUT PREP FUNCTIONS

///////////////// ANIMATION FUNCTIONS
function resetCamera() {
    camera.position.set(0, 0, 5);
    camera.rotation.set(0, 0, 0);
    controls.update();
}

let currentShape;
async function updatePDB(uniprot1, uniprot2) {
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
///////////////// ANIMATION FUNCTIONS

async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error("Error checking file existence:", error);
        return false;
    }
}

function init() {
    // Scene setup
    scene = new THREE.Scene();

    const viewerElement = document.getElementById('viewer');
    const viewerWidth = viewerElement.clientWidth;
    const viewerHeight = viewerElement.clientHeight;

    camera = new THREE.PerspectiveCamera(
        75, // Field of view
        viewerWidth / viewerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewerWidth, viewerHeight);
    viewerElement.appendChild(renderer.domElement);

    renderer.setClearColor(0xaaaaaa);

    // Controls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an option for smoother control
    controls.dampingFactor = 0.25; // damping factor for smoothing
    controls.enableZoom = true; // enable zooming

    // Handle window resize
    window.addEventListener('resize', () => {
        const newViewerWidth = viewerElement.clientWidth;
        const newViewerHeight = viewerElement.clientHeight;
        
        camera.aspect = newViewerWidth / newViewerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newViewerWidth, newViewerHeight);
    });

    // Create the 3Dmol.js viewer within the specified container
    viewer = $3Dmol.createViewer("viewer", {
        defaultcolors: $3Dmol.rasmolElementColors
    });

    // Get the download link element
    downloadLink = document.getElementById('download-link');

    // Animation loop
    animate();

    // Button behavior
    const go_button = document.getElementById('go-button');
    go_button.addEventListener('click', run_two_uniprots);
}

