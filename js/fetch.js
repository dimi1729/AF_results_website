export async function fetchResults(uniprot1, uniprot2, pdb_structure, iptm, pDOCKq, ptm) {
    try {
        const response = await fetch('http://127.0.0.1:5000/get_results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uniprot1: uniprot1,
                uniprot2: uniprot2,
                pdb_structure: pdb_structure,
                iptm: iptm,
                pDOCKq: pDOCKq,
                ptm: ptm
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching results:', error);
    }
}

export async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error("Error checking file existence:", error);
        return false;
    }
}
