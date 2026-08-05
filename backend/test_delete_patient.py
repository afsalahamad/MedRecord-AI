import urllib.request
import json
import pypdf
import io
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Create a Test Patient for Deletion
req1 = urllib.request.Request(
    'http://127.0.0.1:8000/patients',
    data=json.dumps({'name': 'Patient To Delete'}).encode(),
    headers={'Content-Type': 'application/json'}
)
res1 = json.loads(urllib.request.urlopen(req1).read())
patient_id = res1['id']
print(f"[1] Created test patient for deletion: ID='{patient_id}'")

# 2. Upload Document for Patient
pdf_writer = pypdf.PdfWriter()
page = pdf_writer.add_blank_page(width=612, height=792)
pdf_buffer = io.BytesIO()
pdf_writer.write(pdf_buffer)
pdf_bytes = pdf_buffer.getvalue()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="report_to_delete.pdf"\r\n'
    f'Content-Type: application/pdf\r\n\r\n'
).encode('utf-8') + pdf_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

req2 = urllib.request.Request(
    f'http://127.0.0.1:8000/patients/{patient_id}/documents',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)
res2 = json.loads(urllib.request.urlopen(req2).read())
doc_id = res2['document_id']
print(f"[2] Uploaded document ID='{doc_id}' for patient '{patient_id}'")

# 3. Verify Patient & Analysis exist before deletion
req3 = urllib.request.Request(f'http://127.0.0.1:8000/patients/{patient_id}/analysis')
res3 = json.loads(urllib.request.urlopen(req3).read())
print(f"[3] Pre-delete /analysis response exists: document_id='{res3.get('document_id')}'")

# 4. Perform Patient Deletion (DELETE /patients/{patient_id})
req4 = urllib.request.Request(
    f'http://127.0.0.1:8000/patients/{patient_id}',
    method='DELETE'
)
res4 = json.loads(urllib.request.urlopen(req4).read())
print(f"[4] DELETE /patients/{patient_id} response:", res4)

# 5. Verify Patient no longer exists in GET /patients
req5 = urllib.request.Request('http://127.0.0.1:8000/patients')
patients_list = json.loads(urllib.request.urlopen(req5).read())
found = any(p['id'] == patient_id for p in patients_list)
print(f"[5] Post-delete patient in GET /patients: found={found}")

# 6. Verify GET /patients/{id}/analysis returns 404 or null
try:
    req6 = urllib.request.Request(f'http://127.0.0.1:8000/patients/{patient_id}/analysis')
    res6 = json.loads(urllib.request.urlopen(req6).read())
    print(f"[6] Post-delete /analysis response:", res6)
except Exception as e:
    print(f"[6] Post-delete /analysis successfully returned error / empty as expected: {e}")
