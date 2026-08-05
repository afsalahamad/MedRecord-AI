import urllib.request
import json

# 1. Create Patient
req = urllib.request.Request(
    'http://127.0.0.1:8000/patients',
    data=json.dumps({'name': 'Test Trace Patient'}).encode(),
    headers={'Content-Type': 'application/json'}
)
res = json.loads(urllib.request.urlopen(req).read())
patient_id = res['id']
print('[1] Created patient ID:', patient_id)

# 2. Upload sample document
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
content = 'PATIENT DISCHARGE SUMMARY\nPatient Name: Test Trace Patient\nDiagnoses: Hypertension\nMedications: Lisinopril 10mg daily\nLab Results: Creatinine 1.2 mg/dL\n'

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="test_report.txt"\r\n'
    f'Content-Type: text/plain\r\n\r\n'
    f'{content}\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

req2 = urllib.request.Request(
    f'http://127.0.0.1:8000/patients/{patient_id}/documents',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    res2_raw = urllib.request.urlopen(req2).read()
    res2 = json.loads(res2_raw)
    print('[2] Upload API Success output:', json.dumps(res2, indent=2))
except Exception as e:
    print('[2] Upload API Failed:', e)
    if hasattr(e, 'read'):
        print('Error response detail:', e.read().decode())

# 3. GET /patients/{patient_id}/analysis
try:
    req3 = urllib.request.Request(f'http://127.0.0.1:8000/patients/{patient_id}/analysis')
    res3 = json.loads(urllib.request.urlopen(req3).read())
    print('[3] GET /analysis response:', json.dumps(res3, indent=2))
except Exception as e:
    print('[3] GET /analysis Failed:', e)
    if hasattr(e, 'read'):
        print('Error detail:', e.read().decode())
