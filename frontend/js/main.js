// ========== PAGE LOADER ==========
async function loadPage(page) {
    try {
        const content = document.getElementById('content');
        
        switch(page) {
            case 'dashboard':
                content.innerHTML = '<h2>Loading Dashboard...</h2>';
                const dashboardHTML = await loadDashboard();
                content.innerHTML = dashboardHTML;
                initDashboard();
                break;
            case 'pasien':
                content.innerHTML = '<h2>Loading Pasien...</h2>';
                const pasienHTML = await loadPasien();
                content.innerHTML = pasienHTML;
                initPasien();
                break;
            case 'dokter':
                content.innerHTML = '<h2>Loading Dokter...</h2>';
                const dokterHTML = await loadDokter();
                content.innerHTML = dokterHTML;
                initDokter();
                break;
            case 'konsultasi':
                content.innerHTML = '<h2>Loading Konsultasi...</h2>';
                const konsultasiHTML = await loadKonsultasi();
                content.innerHTML = konsultasiHTML;
                initKonsultasi();
                break;
            case 'rekam-medis':
                content.innerHTML = '<h2>Loading Rekam Medis...</h2>';
                const rekammedisHTML = await loadRekamMedis();
                content.innerHTML = rekammedisHTML;
                initRekamMedis();
                break;
            default:
                content.innerHTML = '<h2>Page not found</h2>';
        }
    } catch (error) {
        console.error('Error loading page:', error);
        document.getElementById('content').innerHTML = '<div class="alert alert-error">Error loading page</div>';
    }
}

// ========== LOAD HTML FILES ==========
async function loadDashboard() {
    const response = await fetch('pages/dashboard.html');
    return await response.text();
}

async function loadPasien() {
    const response = await fetch('pages/pasien.html');
    return await response.text();
}

async function loadDokter() {
    const response = await fetch('pages/dokter.html');
    return await response.text();
}

async function loadKonsultasi() {
    const response = await fetch('pages/konsultasi.html');
    return await response.text();
}

async function loadRekamMedis() {
    const response = await fetch('pages/rekam-medis.html');
    return await response.text();
}

// ========== MODAL FUNCTIONS ==========
function openModal(title, content) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `<h2>${title}</h2>${content}`;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', function() {
    loadPage('dashboard');
});

// ========== DASHBOARD PAGE ==========
async function initDashboard() {
    try {
        const patients = await PatientAPI.getAll();
        const doctors = await DoctorAPI.getAll();
        const consultations = await ConsultationAPI.getAll();
        const records = await RecordAPI.getAll();

        document.getElementById('patient-count').textContent = patients.length || 0;
        document.getElementById('doctor-count').textContent = doctors.length || 0;
        document.getElementById('consultation-count').textContent = consultations.length || 0;
        document.getElementById('record-count').textContent = records.length || 0;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

// ========== PASIEN PAGE ==========
async function initPasien() {
    try {
        await displayPatients();

        // Form submission
        document.getElementById('form-pasien').addEventListener('submit', async function(e) {
            e.preventDefault();
            await addPatient();
        });
    } catch (error) {
        console.error('Error initializing pasien page:', error);
    }
}

async function displayPatients() {
    try {
        const patients = await PatientAPI.getAll();
        const tbody = document.getElementById('pasien-tbody');
        
        if (patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Tidak ada data pasien</td></tr>';
            return;
        }

        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.id}</td>
                <td>${patient.full_name}</td>
                <td>${patient.gender}</td>
                <td>${formatDate(patient.date_of_birth)}</td>
                <td>${patient.phone || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-small" onclick="editPatient(${patient.id})">Edit</button>
                        <button class="btn btn-secondary btn-small" onclick="viewPatient(${patient.id})">Lihat</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error displaying patients:', error);
        showAlert('Error loading patients', 'error');
    }
}

async function addPatient() {
    try {
        const fullName = document.getElementById('full_name').value;
        const gender = document.getElementById('gender').value;
        const dateOfBirth = document.getElementById('date_of_birth').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;

        if (!fullName || !gender || !dateOfBirth) {
            showAlert('Nama, jenis kelamin, dan tanggal lahir harus diisi', 'error');
            return;
        }

        await PatientAPI.create({
            full_name: fullName,
            gender: gender,
            date_of_birth: dateOfBirth,
            phone: phone || null,
            address: address || null
        });

        document.getElementById('form-pasien').reset();
        showAlert('Pasien berhasil ditambahkan', 'success');
        await displayPatients();
    } catch (error) {
        console.error('Error adding patient:', error);
        showAlert(error.message || 'Error adding patient', 'error');
    }
}

async function viewPatient(id) {
    try {
        const patient = await PatientAPI.getById(id);
        const content = `
            <div>
                <p><strong>Nama:</strong> ${patient.full_name}</p>
                <p><strong>Jenis Kelamin:</strong> ${patient.gender}</p>
                <p><strong>Tanggal Lahir:</strong> ${formatDate(patient.date_of_birth)}</p>
                <p><strong>Telepon:</strong> ${patient.phone || '-'}</p>
                <p><strong>Alamat:</strong> ${patient.address || '-'}</p>
                <p><strong>Tanggal Daftar:</strong> ${formatDateTime(patient.created_at)}</p>
            </div>
        `;
        openModal(`Detail Pasien - ${patient.full_name}`, content);
    } catch (error) {
        console.error('Error viewing patient:', error);
        showAlert('Error loading patient details', 'error');
    }
}

async function editPatient(id) {
    try {
        const patient = await PatientAPI.getById(id);
        const content = `
            <form onsubmit="submitEditPatient(event, ${id})">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="edit_full_name" value="${patient.full_name}" required>
                </div>
                <div class="form-group">
                    <label>Jenis Kelamin</label>
                    <select id="edit_gender" required>
                        <option value="Laki-laki" ${patient.gender === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                        <option value="Perempuan" ${patient.gender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tanggal Lahir</label>
                    <input type="date" id="edit_date_of_birth" value="${patient.date_of_birth}" required>
                </div>
                <div class="form-group">
                    <label>Telepon</label>
                    <input type="text" id="edit_phone" value="${patient.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Alamat</label>
                    <textarea id="edit_address">${patient.address || ''}</textarea>
                </div>
                <button type="submit" class="btn-submit">Update Pasien</button>
            </form>
        `;
        openModal(`Edit Pasien - ${patient.full_name}`, content);
    } catch (error) {
        console.error('Error editing patient:', error);
        showAlert('Error loading patient data', 'error');
    }
}

async function submitEditPatient(event, id) {
    event.preventDefault();
    try {
        await PatientAPI.update(id, {
            full_name: document.getElementById('edit_full_name').value,
            gender: document.getElementById('edit_gender').value,
            date_of_birth: document.getElementById('edit_date_of_birth').value,
            phone: document.getElementById('edit_phone').value || null,
            address: document.getElementById('edit_address').value || null
        });
        closeModal();
        showAlert('Pasien berhasil diupdate', 'success');
        await displayPatients();
    } catch (error) {
        console.error('Error updating patient:', error);
        showAlert(error.message || 'Error updating patient', 'error');
    }
}

// ========== DOKTER PAGE ==========
async function initDokter() {
    try {
        await displayDoctors();

        document.getElementById('form-dokter').addEventListener('submit', async function(e) {
            e.preventDefault();
            await addDoctor();
        });
    } catch (error) {
        console.error('Error initializing dokter page:', error);
    }
}

async function displayDoctors() {
    try {
        const doctors = await DoctorAPI.getAll();
        const tbody = document.getElementById('dokter-tbody');
        
        if (doctors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Tidak ada data dokter</td></tr>';
            return;
        }

        tbody.innerHTML = doctors.map(doctor => `
            <tr>
                <td>${doctor.id}</td>
                <td>${doctor.full_name}</td>
                <td>${doctor.specialization}</td>
                <td>${doctor.phone || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-small" onclick="editDoctor(${doctor.id})">Edit</button>
                        <button class="btn btn-secondary btn-small" onclick="viewDoctor(${doctor.id})">Lihat</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error displaying doctors:', error);
        showAlert('Error loading doctors', 'error');
    }
}

async function addDoctor() {
    try {
        const fullName = document.getElementById('full_name').value;
        const specialization = document.getElementById('specialization').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;

        if (!fullName || !specialization) {
            showAlert('Nama dan spesialisasi harus diisi', 'error');
            return;
        }

        await DoctorAPI.create({
            full_name: fullName,
            specialization: specialization,
            phone: phone || null,
            email: email || null
        });

        document.getElementById('form-dokter').reset();
        showAlert('Dokter berhasil ditambahkan', 'success');
        await displayDoctors();
    } catch (error) {
        console.error('Error adding doctor:', error);
        showAlert(error.message || 'Error adding doctor', 'error');
    }
}

async function viewDoctor(id) {
    try {
        const doctor = await DoctorAPI.getById(id);
        const content = `
            <div>
                <p><strong>Nama:</strong> ${doctor.full_name}</p>
                <p><strong>Spesialisasi:</strong> ${doctor.specialization}</p>
                <p><strong>Telepon:</strong> ${doctor.phone || '-'}</p>
                <p><strong>Email:</strong> ${doctor.email || '-'}</p>
            </div>
        `;
        openModal(`Detail Dokter - ${doctor.full_name}`, content);
    } catch (error) {
        console.error('Error viewing doctor:', error);
        showAlert('Error loading doctor details', 'error');
    }
}

async function editDoctor(id) {
    try {
        const doctor = await DoctorAPI.getById(id);
        const content = `
            <form onsubmit="submitEditDoctor(event, ${id})">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="edit_full_name" value="${doctor.full_name}" required>
                </div>
                <div class="form-group">
                    <label>Spesialisasi</label>
                    <input type="text" id="edit_specialization" value="${doctor.specialization}" required>
                </div>
                <div class="form-group">
                    <label>Telepon</label>
                    <input type="text" id="edit_phone" value="${doctor.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="edit_email" value="${doctor.email || ''}">
                </div>
                <button type="submit" class="btn-submit">Update Dokter</button>
            </form>
        `;
        openModal(`Edit Dokter - ${doctor.full_name}`, content);
    } catch (error) {
        console.error('Error editing doctor:', error);
        showAlert('Error loading doctor data', 'error');
    }
}

async function submitEditDoctor(event, id) {
    event.preventDefault();
    try {
        await DoctorAPI.update(id, {
            full_name: document.getElementById('edit_full_name').value,
            specialization: document.getElementById('edit_specialization').value,
            phone: document.getElementById('edit_phone').value || null,
            email: document.getElementById('edit_email').value || null
        });
        closeModal();
        showAlert('Dokter berhasil diupdate', 'success');
        await displayDoctors();
    } catch (error) {
        console.error('Error updating doctor:', error);
        showAlert(error.message || 'Error updating doctor', 'error');
    }
}

// ========== KONSULTASI PAGE ==========
async function initKonsultasi() {
    try {
        await displayConsultations();
        await populateConsultationSelects();

        document.getElementById('form-konsultasi').addEventListener('submit', async function(e) {
            e.preventDefault();
            await addConsultation();
        });
    } catch (error) {
        console.error('Error initializing konsultasi page:', error);
    }
}

async function displayConsultations() {
    try {
        const consultations = await ConsultationAPI.getAll();
        const tbody = document.getElementById('konsultasi-tbody');
        
        if (consultations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Tidak ada data konsultasi</td></tr>';
            return;
        }

        tbody.innerHTML = consultations.map(consult => `
            <tr>
                <td>${consult.id}</td>
                <td>${consult.patient_id}</td>
                <td>${consult.doctor_id}</td>
                <td>${consult.complaint}</td>
                <td>${formatDate(consult.consultation_date)}</td>
                <td>${consult.status}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-small" onclick="editConsultation(${consult.id})">Edit</button>
                        <button class="btn btn-secondary btn-small" onclick="viewConsultation(${consult.id})">Lihat</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error displaying consultations:', error);
        showAlert('Error loading consultations', 'error');
    }
}

async function populateConsultationSelects() {
    try {
        const patients = await PatientAPI.getAll();
        const doctors = await DoctorAPI.getAll();

        const patientSelect = document.getElementById('patient_id');
        const doctorSelect = document.getElementById('doctor_id');

        patientSelect.innerHTML = '<option value="">-- Pilih Pasien --</option>' + 
            patients.map(p => `<option value="${p.id}">${p.id} - ${p.full_name}</option>`).join('');

        doctorSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>' + 
            doctors.map(d => `<option value="${d.id}">${d.id} - ${d.full_name}</option>`).join('');
    } catch (error) {
        console.error('Error populating selects:', error);
    }
}

async function addConsultation() {
    try {
        const patientId = document.getElementById('patient_id').value;
        const doctorId = document.getElementById('doctor_id').value;
        const complaint = document.getElementById('complaint').value;
        const consultationResult = document.getElementById('consultation_result').value;
        const consultationDate = document.getElementById('consultation_date').value;
        const status = document.getElementById('status').value;

        if (!patientId || !doctorId || !complaint || !consultationResult || !consultationDate) {
            showAlert('Semua field harus diisi', 'error');
            return;
        }

        await ConsultationAPI.create({
            patient_id: parseInt(patientId),
            doctor_id: parseInt(doctorId),
            complaint: complaint,
            consultation_result: consultationResult,
            consultation_date: consultationDate,
            status: status
        });

        document.getElementById('form-konsultasi').reset();
        showAlert('Konsultasi berhasil ditambahkan', 'success');
        await displayConsultations();
    } catch (error) {
        console.error('Error adding consultation:', error);
        showAlert(error.message || 'Error adding consultation', 'error');
    }
}

async function viewConsultation(id) {
    try {
        const consult = await ConsultationAPI.getById(id);
        const content = `
            <div>
                <p><strong>ID Pasien:</strong> ${consult.patient_id}</p>
                <p><strong>ID Dokter:</strong> ${consult.doctor_id}</p>
                <p><strong>Keluhan:</strong> ${consult.complaint}</p>
                <p><strong>Hasil Konsultasi:</strong> ${consult.consultation_result}</p>
                <p><strong>Tanggal Konsultasi:</strong> ${formatDate(consult.consultation_date)}</p>
                <p><strong>Status:</strong> ${consult.status}</p>
                <p><strong>Dibuat:</strong> ${formatDateTime(consult.created_at)}</p>
            </div>
        `;
        openModal(`Detail Konsultasi #${id}`, content);
    } catch (error) {
        console.error('Error viewing consultation:', error);
        showAlert('Error loading consultation details', 'error');
    }
}

async function editConsultation(id) {
    try {
        const consult = await ConsultationAPI.getById(id);
        const content = `
            <form onsubmit="submitEditConsultation(event, ${id})">
                <div class="form-group">
                    <label>Keluhan</label>
                    <textarea id="edit_complaint">${consult.complaint}</textarea>
                </div>
                <div class="form-group">
                    <label>Hasil Konsultasi</label>
                    <textarea id="edit_consultation_result">${consult.consultation_result}</textarea>
                </div>
                <div class="form-group">
                    <label>Tanggal Konsultasi</label>
                    <input type="date" id="edit_consultation_date" value="${consult.consultation_date}" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit_status" required>
                        <option value="done" ${consult.status === 'done' ? 'selected' : ''}>Selesai</option>
                        <option value="pending" ${consult.status === 'pending' ? 'selected' : ''}>Menunggu</option>
                        <option value="cancelled" ${consult.status === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit">Update Konsultasi</button>
            </form>
        `;
        openModal(`Edit Konsultasi #${id}`, content);
    } catch (error) {
        console.error('Error editing consultation:', error);
        showAlert('Error loading consultation data', 'error');
    }
}

async function submitEditConsultation(event, id) {
    event.preventDefault();
    try {
        await ConsultationAPI.update(id, {
            complaint: document.getElementById('edit_complaint').value,
            consultation_result: document.getElementById('edit_consultation_result').value,
            consultation_date: document.getElementById('edit_consultation_date').value,
            status: document.getElementById('edit_status').value
        });
        closeModal();
        showAlert('Konsultasi berhasil diupdate', 'success');
        await displayConsultations();
    } catch (error) {
        console.error('Error updating consultation:', error);
        showAlert(error.message || 'Error updating consultation', 'error');
    }
}

// ========== REKAM MEDIS PAGE ==========
async function initRekamMedis() {
    try {
        await displayRecords();
        await populateRecordSelects();

        document.getElementById('form-rekam-medis').addEventListener('submit', async function(e) {
            e.preventDefault();
            await addRecord();
        });
    } catch (error) {
        console.error('Error initializing rekam medis page:', error);
    }
}

async function displayRecords() {
    try {
        const records = await RecordAPI.getAll();
        const tbody = document.getElementById('rekam-medis-tbody');
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Tidak ada data rekam medis</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${record.id}</td>
                <td>${record.patient_id}</td>
                <td>${record.doctor_id}</td>
                <td>${record.diagnosis}</td>
                <td>${formatDate(record.visit_date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-small" onclick="editRecord(${record.id})">Edit</button>
                        <button class="btn btn-secondary btn-small" onclick="viewRecord(${record.id})">Lihat</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error displaying records:', error);
        showAlert('Error loading records', 'error');
    }
}

async function populateRecordSelects() {
    try {
        const patients = await PatientAPI.getAll();
        const doctors = await DoctorAPI.getAll();

        const patientSelect = document.getElementById('patient_id');
        const doctorSelect = document.getElementById('doctor_id');

        patientSelect.innerHTML = '<option value="">-- Pilih Pasien --</option>' + 
            patients.map(p => `<option value="${p.id}">${p.id} - ${p.full_name}</option>`).join('');

        doctorSelect.innerHTML = '<option value="">-- Pilih Dokter --</option>' + 
            doctors.map(d => `<option value="${d.id}">${d.id} - ${d.full_name}</option>`).join('');
    } catch (error) {
        console.error('Error populating selects:', error);
    }
}

async function addRecord() {
    try {
        const patientId = document.getElementById('patient_id').value;
        const doctorId = document.getElementById('doctor_id').value;
        const diagnosis = document.getElementById('diagnosis').value;
        const treatment = document.getElementById('treatment').value;
        const visitDate = document.getElementById('visit_date').value;
        const notes = document.getElementById('notes').value;

        if (!patientId || !doctorId || !diagnosis || !treatment || !visitDate) {
            showAlert('Semua field harus diisi', 'error');
            return;
        }

        await RecordAPI.create({
            patient_id: parseInt(patientId),
            doctor_id: parseInt(doctorId),
            diagnosis: diagnosis,
            treatment: treatment,
            visit_date: visitDate,
            notes: notes || null
        });

        document.getElementById('form-rekam-medis').reset();
        showAlert('Rekam medis berhasil ditambahkan', 'success');
        await displayRecords();
    } catch (error) {
        console.error('Error adding record:', error);
        showAlert(error.message || 'Error adding record', 'error');
    }
}

async function viewRecord(id) {
    try {
        const record = await RecordAPI.getById(id);
        const content = `
            <div>
                <p><strong>ID Pasien:</strong> ${record.patient_id}</p>
                <p><strong>ID Dokter:</strong> ${record.doctor_id}</p>
                <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
                <p><strong>Pengobatan:</strong> ${record.treatment}</p>
                <p><strong>Tanggal Kunjungan:</strong> ${formatDate(record.visit_date)}</p>
                <p><strong>Catatan:</strong> ${record.notes || '-'}</p>
                <p><strong>Dibuat:</strong> ${formatDateTime(record.created_at)}</p>
            </div>
        `;
        openModal(`Detail Rekam Medis #${id}`, content);
    } catch (error) {
        console.error('Error viewing record:', error);
        showAlert('Error loading record details', 'error');
    }
}

async function editRecord(id) {
    try {
        const record = await RecordAPI.getById(id);
        const content = `
            <form onsubmit="submitEditRecord(event, ${id})">
                <div class="form-group">
                    <label>Diagnosis</label>
                    <textarea id="edit_diagnosis">${record.diagnosis}</textarea>
                </div>
                <div class="form-group">
                    <label>Pengobatan</label>
                    <textarea id="edit_treatment">${record.treatment}</textarea>
                </div>
                <div class="form-group">
                    <label>Tanggal Kunjungan</label>
                    <input type="date" id="edit_visit_date" value="${record.visit_date}" required>
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea id="edit_notes">${record.notes || ''}</textarea>
                </div>
                <button type="submit" class="btn-submit">Update Rekam Medis</button>
            </form>
        `;
        openModal(`Edit Rekam Medis #${id}`, content);
    } catch (error) {
        console.error('Error editing record:', error);
        showAlert('Error loading record data', 'error');
    }
}

async function submitEditRecord(event, id) {
    event.preventDefault();
    try {
        await RecordAPI.update(id, {
            diagnosis: document.getElementById('edit_diagnosis').value,
            treatment: document.getElementById('edit_treatment').value,
            visit_date: document.getElementById('edit_visit_date').value,
            notes: document.getElementById('edit_notes').value || null
        });
        closeModal();
        showAlert('Rekam medis berhasil diupdate', 'success');
        await displayRecords();
    } catch (error) {
        console.error('Error updating record:', error);
        showAlert(error.message || 'Error updating record', 'error');
    }
}
