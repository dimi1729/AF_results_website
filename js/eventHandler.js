import { fetchResults } from './fetch.js';
import { loadPDB } from './pdb_animation.js';

function check_uniprot_is_valid(uniprot) {
    return true;
}

function check_checkboxes_are_valid(checkboxList) {
    return checkboxList.includes(true);
}

function check_input_is_valid(uniprot1, uniprot2, checkboxList) {
    let is_valid = true;

    if (!check_uniprot_is_valid(uniprot1)) {
        alert('The first Uniprot ' + uniprot1 + ' cannot be found in the list of human mitochondrial proteins');
        is_valid = false;
    }
    if (!check_uniprot_is_valid(uniprot2)) {
        alert('The second Uniprot ' + uniprot2 + ' cannot be found in the list of human mitochondrial proteins');
        is_valid = false;
    }
    if (!check_checkboxes_are_valid(checkboxList)) {
        alert('Please select at least one of the options for scores to see');
        is_valid = false;
    }

    return is_valid;
}

export function run_two_uniprots(event) {
    event.preventDefault();

    const uniprot1 = document.getElementById('Uniprot1').value;
    const uniprot2 = document.getElementById('Uniprot2').value;

    const pdb_structure = document.getElementById('pdb_structure').checked;
    const iptm = document.getElementById('iptm').checked;
    const pDOCKq = document.getElementById('pDOCKq').checked;
    const ptm = document.getElementById('ptm').checked;

    const checkboxList = [pdb_structure, iptm, pDOCKq, ptm];

    if (!check_input_is_valid(uniprot1, uniprot2, checkboxList)) return;

    fetchResults(uniprot1, uniprot2, pdb_structure, iptm, pDOCKq, ptm)
        .then(data => {
            console.log("Fetched data:", data);
            if (data && data.success) {
                if (pdb_structure) {
                    console.log("File ID:", data.file_id);
                    loadPDB(data.file_id);
                }
                if (iptm) {
                    const iptmResultElement = document.getElementById('iptm-results');
                    if (iptmResultElement) {
                        iptmResultElement.style.display = 'block';
                        iptmResultElement.innerText = `IPTM: ${data.iptm}`;
                    }
                }
                if (pDOCKq) {
                    const pDOCKqResultElement = document.getElementById('pDOCKq-results');
                    if (pDOCKqResultElement) {
                        pDOCKqResultElement.style.display = 'block';
                        pDOCKqResultElement.innerText = `pDOCKq: ${data.pDOCKq}`;
                    }
                }
                if (ptm) {
                    const ptmResultElement = document.getElementById('ptm-results');
                    if (ptmResultElement) {
                        ptmResultElement.style.display = 'block';
                        ptmResultElement.innerText = `PTM: ${data.ptm}`;
                    }
                }
            } else {
                alert('No matching document found in the database');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
