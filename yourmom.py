from pymongo import MongoClient
from gridfs import GridFS
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
import io

# Step 1: Authenticate and create the PyDrive client
gauth = GoogleAuth()
gauth.LocalWebserverAuth()  # Creates local webserver and auto handles authentication.
drive = GoogleDrive(gauth)

# Function to download a file from Google Drive
def download_file_from_drive(file_id):
    downloaded = drive.CreateFile({'id': file_id})
    file_content = io.BytesIO()
    downloaded.GetContentFile(file_content)
    return file_content

# Step 2: Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['predictions_db']
fs = GridFS(db)

# Step 3: Define prediction details
prediction_name = "Q99379_Q05892"
iptm_score = 0.85  # Example score
image_file_id = "1sMUACLofkX-gwuIplIkj-d1GK1lbQWf_"  # Replace with actual file ID from Google Drive

# Step 4: Download image file from Google Drive
image_content = download_file_from_drive(image_file_id)

# Step 5: Store image file in GridFS
image_id = fs.put(image_content, filename=f"{prediction_name}.png")

# Step 6: Create a document for the prediction
prediction_document = {
    "prediction_name": prediction_name,
    "iptm_score": iptm_score,
    "image_file_id": image_id
}

# Step 7: Insert the document into MongoDB
predictions_collection = db['predictions']
predictions_collection.insert_one(prediction_document)

print("Prediction uploaded successfully")
