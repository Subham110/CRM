const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Common fetch wrapper with error parsing
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err) => `${err.loc?.slice(-1)[0]}: ${err.msg}`).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        }
      } catch {
        // Fall back to HTTP status message
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error on ${url}:`, error);
    throw error;
  }
}

export const api = {
  // Healthcheck endpoint
  checkHealth: async () => {
    return apiRequest('/health');
  },

  // Doctors endpoints
  getDoctors: async () => {
    return apiRequest('/doctors/');
  },

  // AI ReAct Agent & MCP endpoints
  parseWithAgent: async (prompt) => {
    return apiRequest('/agent/parse', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  getMCPTools: async () => {
    return apiRequest('/agent/tools');
  },

  // Appointments endpoints
  getAppointments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.doctor) query.append('doctor', params.doctor);
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/appointments/${queryString}`);
  },

  getAppointmentById: async (id) => {
    return apiRequest(`/appointments/${id}`);
  },

  createAppointment: async (appointmentData) => {
    return apiRequest('/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  updateAppointment: async (id, updateData) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  cancelAppointment: async (id) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

