// ========== API CONFIGURATION ==========
const API_BASE_URL = 'http://localhost:4000/api';

// ========== HELPER FUNCTIONS ==========
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || `HTTP Error: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========== PATIENT API ==========
const PatientAPI = {
    getAll: () => apiCall('/patients'),
    
    getById: (id) => apiCall(`/patients/${id}`),
    
    create: (data) => apiCall('/patients', 'POST', data),
    
    register: (data) => apiCall('/patients/register', 'POST', data),
    
    update: (id, data) => apiCall(`/patients/${id}`, 'PUT', data)
};

// ========== DOCTOR API ==========
const DoctorAPI = {
    getAll: () => apiCall('/doctors'),
    
    getById: (id) => apiCall(`/doctors/${id}`),
    
    create: (data) => apiCall('/doctors', 'POST', data),
    
    update: (id, data) => apiCall(`/doctors/${id}`, 'PUT', data)
};

// ========== CONSULTATION API ==========
const ConsultationAPI = {
    getAll: () => apiCall('/consultations'),
    
    getById: (id) => apiCall(`/consultations/${id}`),
    
    getByPatientId: (patientId) => apiCall(`/consultations/patient/${patientId}`),
    
    create: (data) => apiCall('/consultations', 'POST', data),
    
    update: (id, data) => apiCall(`/consultations/${id}`, 'PUT', data)
};

// ========== MEDICAL RECORD API ==========
const RecordAPI = {
    getAll: () => apiCall('/records'),
    
    getById: (id) => apiCall(`/records/${id}`),
    
    getByPatientId: (patientId) => apiCall(`/records/patient/${patientId}`),
    
    create: (data) => apiCall('/records', 'POST', data),
    
    update: (id, data) => apiCall(`/records/${id}`, 'PUT', data)
};

// ========== UI HELPER FUNCTIONS ==========
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const content = document.getElementById('content');
    content.insertBefore(alertDiv, content.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
