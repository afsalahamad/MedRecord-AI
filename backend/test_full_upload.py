import urllib.request
import json
import pypdf
import io
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# 1. Create Patient
req = urllib.request.Request(
    'http://127.0.0.1:8000/patients',
    data=json.dumps({'name': 'Live Verification Patient'}).encode(),
    headers={'Content-Type': 'application/json'}
)
res = json.loads(urllib.request.urlopen(req).read())
patient_id = res['id']
print('[1] Created patient ID:', patient_id)

# 2. Generate PDF with readable text
pdf_writer = pypdf.PdfWriter()
page = pdf_writer.add_blank_page(width=612, height=792)
pdf_buffer = io.BytesIO()
pdf_writer.write(pdf_buffer)
pdf_bytes = pdf_buffer.getvalue()

# Upload PDF
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="medical_report.pdf"\r\n'
    f'Content-Type: application/pdf\r\n\r\n'
).encode('utf-8') + pdf_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

req2 = urllib.request.Request(
    f'http://127.0.0.1:8000/patients/{patient_id}/documents',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    res2_raw = urllib.request.urlopen(req2).read()
    res2 = json.loads(res2_raw)
    print('[2] Automatic AI Analysis Result:', json.dumps(res2['extracted'], indent=2))
except Exception as e:
    print('[2] Upload API Failed:', e)

# 3. Test AI Chatbot
try:
    req3 = urllib.request.Request(
        f'http://127.0.0.1:8000/patients/{patient_id}/chat',
        data=json.dumps({'question': 'Hello! What can you help me with?'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res3_raw = urllib.request.urlopen(req3).read()
    res3 = json.loads(res3_raw)
    print('[3] AI Chatbot Answer:\n', res3['answer'])
    print('[3] AI Chatbot Confidence:', res3['confidence'])
except Exception as e:
    print('[3] AI Chatbot Failed:', e)
