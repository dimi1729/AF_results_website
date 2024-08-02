from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
import gridfs
from bson import ObjectId, json_util
import io

app = Flask(__name__)
CORS(app)

# Set up MongoDB connection
client = MongoClient('localhost', 27017)
db = client['test']
fs = gridfs.GridFS(db)
collection = db['idk']

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    if file:
        file_id = fs.put(file, filename=file.filename)
        return jsonify({"file_id": str(file_id), "filename": file.filename}), 201
    else:
        return jsonify({"error": "No file provided"}), 400

@app.route('/store_document', methods=['POST'])
def store_document():
    data = request.json
    name = data.get('name')
    iptm = data.get('iptm')
    ptm = data.get('ptm')
    pDOCKq = data.get('pDOCKq')
    file_id = data.get('file_id')

    document = {
        "name": name,
        "iptm": iptm,
        "ptm": ptm,
        "pDOCKq": pDOCKq,
        "file_id": ObjectId(file_id)  # Store the file ID in the document
    }

    collection.insert_one(document)
    return jsonify({"message": "Document stored successfully"}), 201

@app.route('/get_file/<document_id>', methods=['GET'])
def get_file(document_id):
    document = collection.find_one({"_id": ObjectId(document_id)})
    if document and "file_id" in document:
        try:
            file = fs.get(document["file_id"])
            return file.read(), 200, {
                'Content-Disposition': f'attachment; filename="{file.filename}"',
                'Content-Type': 'application/octet-stream'
            }
        except Exception as e:
            return jsonify({"error": str(e)}), 404
    else:
        return jsonify({"error": "No file found in document"}), 404
    
@app.route('/get_data/<name>', methods=['GET'])
def get_data(name):
    document = collection.find_one({"name": name})
    if document:
        return json_util.dumps(document), 200
    else:
        return jsonify({"error": "Document not found"}), 404
    
@app.route('/get_results', methods=['POST'])
def get_results():
    data = request.json
    uniprot1 = data.get('uniprot1')
    uniprot2 = data.get('uniprot2')
    pdb_structure = data.get('pdb_structure')
    iptm = data.get('iptm')
    pDOCKq = data.get('pDOCKq')
    ptm = data.get('ptm')

    query = {"name": f"{uniprot1}_{uniprot2}"}
    document = collection.find_one(query)

    if document:
        file_id = str(document.get('file_id', ''))
        print(f"Retrieved file_id: {file_id}")  # Log file_id
        response = {
            "success": True,
            "file_id": file_id,  # Ensure file_id is retrieved correctly
            "iptm": document.get('iptm', ''),
            "pDOCKq": document.get('pDOCKq', ''),
            "ptm": document.get('ptm', '')
        }
    else:
        response = {"success": False}

    return jsonify(response)

@app.route('/get_pdb/<file_id>', methods=['GET'])
def get_pdb(file_id):
    try:
        print(f"Attempting to retrieve file with ID: {file_id}")  # Log the file ID being retrieved
        object_id = ObjectId(file_id)
        file = fs.get(object_id)
        print(f"File retrieved: {file}")  # Log file retrieval success
        return send_file(io.BytesIO(file.read()), download_name='structure.pdb', as_attachment=False)
    except Exception as e:
        print(f"Error retrieving file: {e}")  # Log the error
        return jsonify({"error": str(e)}), 404


if __name__ == '__main__':
    app.run(debug=True)
