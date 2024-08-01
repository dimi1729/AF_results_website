from flask import Flask, request, jsonify
from pymongo import MongoClient
import gridfs
from bson import ObjectId

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)
