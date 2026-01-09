// API Base URL
// Use relative path '/api' by default so it works with both Vite proxy (local) and Vercel rewrites (prod)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Helper function to make authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Get response text first
    const text = await response.text();

    if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        let errorMessage = 'An error occurred';
        try {
            if (text) {
                const error = JSON.parse(text);
                errorMessage = error.error || error.message || errorMessage;
            }
        } catch (e) {
            // If JSON parse fails, use text or status text
            errorMessage = text || response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    // Parse successful response
    try {
        return text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Invalid JSON response from server');
    }
};

// ==================== AUTH API ====================

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export const authAPI = {
    // Register new user
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await authFetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Save token to localStorage
        if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
        }

        return response;
    },

    // Login user
    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await authFetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Save token to localStorage
        if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
        }

        return response;
    },

    // Get current user
    getCurrentUser: async () => {
        return authFetch(`${API_BASE_URL}/auth/me`);
    },

    // Logout
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
    },

    // Check if user is logged in
    isAuthenticated: (): boolean => {
        return !!getAuthToken();
    },

    // Get current user from localStorage
    getCurrentUserFromStorage: () => {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
};

// ==================== TRIPS API ====================

export interface CreateTripData {
    title: string;
    destination: string;
    description?: string;
    startDate: string;
    endDate?: string;
    budget?: string;
    maxParticipants?: number;
    category?: string;
    imageUrl?: string;
}

export interface UpdateTripData extends Partial<CreateTripData> { }

export interface JoinTripData {
    name: string;
    interests?: string[];
}

export interface JoinTripData {
    name: string;
    interests?: string[];
}

export const tripsAPI = {
    // Get all trips with optional filters
    getAll: async (filters?: {
        destination?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }

        const url = `${API_BASE_URL}/trips${params.toString() ? `?${params.toString()}` : ''}`;
        return authFetch(url);
    },

    // Get single trip by ID
    getById: async (id: string) => {
        return authFetch(`${API_BASE_URL}/trips/${id}`);
    },

    // Create new trip (requires auth)
    create: async (data: CreateTripData) => {
        return authFetch(`${API_BASE_URL}/trips`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update trip (requires auth)
    update: async (id: string, data: UpdateTripData) => {
        return authFetch(`${API_BASE_URL}/trips/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete trip (requires auth)
    delete: async (id: string) => {
        return authFetch(`${API_BASE_URL}/trips/${id}`, {
            method: 'DELETE',
        });
    },

    // Join trip (requires auth)
    join: async (id: string, data: JoinTripData) => {
        return authFetch(`${API_BASE_URL}/trips/${id}/join`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Leave trip (requires auth)
    leave: async (id: string) => {
        return authFetch(`${API_BASE_URL}/trips/${id}/leave`, {
            method: 'DELETE',
        });
    },
};

// Messages API
export const messagesAPI = {
    // Group Chat - Get messages for a trip
    getTripMessages: async (tripId: string) => {
        return authFetch(`${API_BASE_URL}/messages/trips/${tripId}`);
    },

    // Group Chat - Send message to a trip
    sendTripMessage: async (tripId: string, content: string) => {
        return authFetch(`${API_BASE_URL}/messages/trips/${tripId}`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    // Private Chat - Get all conversations
    getConversations: async () => {
        return authFetch(`${API_BASE_URL}/messages/conversations`);
    },

    // Private Chat - Get messages with a specific user
    getPrivateMessages: async (userId: string) => {
        return authFetch(`${API_BASE_URL}/messages/private/${userId}`);
    },

    // Private Chat - Send message to a specific user
    sendPrivateMessage: async (userId: string, content: string) => {
        return authFetch(`${API_BASE_URL}/messages/private/${userId}`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    // Private Chat - Delete conversation with a specific user
    deleteConversation: async (userId: string) => {
        return authFetch(`${API_BASE_URL}/messages/private/${userId}`, {
            method: 'DELETE',
        });
    },

    deleteMessage: async (messageId: string) => {
        return authFetch(`${API_BASE_URL}/messages/${messageId}`, {
            method: 'DELETE',
        });
    },
};

export const userAPI = {
    getProfile: () => authFetch(`${API_BASE_URL}/users/profile`),
    updateProfile: (data: { name?: string; password?: string; interests?: string[] }) => authFetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

export default {
    auth: authAPI,
    trips: tripsAPI,
    messages: messagesAPI,
};
