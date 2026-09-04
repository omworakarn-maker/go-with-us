import Foundation

// ใช้ร่วมกันทั้งโปรเจกต์เพื่อไม่ให้ SwiftUI Preview เรียก API/WebSocket จริง
// ซึ่งอาจทำให้ Preview รอเกินเวลาที่ Xcode กำหนดและขึ้น UpdateTimedOutError
enum AppRuntime {
    static var isRunningForPreview: Bool {
        ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1"
    }
}

// MARK: - API Service
class APIService {
    static let shared = APIService()
    
    // Base URL - Production (Vercel)
    // private let baseURL = "https://go-with-us.vercel.app/api"
    // private let baseURL = "http://192.168.1.88:3000/api" // Local backup
    
    // Base URL - Production (Render)
    let baseURL = "https://go-with-us-czc8.onrender.com/api"
    
    private init() {}
    
    // MARK: - Generic Request Method
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        queryItems: [URLQueryItem]? = nil,
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        guard !AppRuntime.isRunningForPreview else {
            throw APIError.previewNetworkDisabled
        }

        // Construct URL with query items
        guard var components = URLComponents(string: baseURL + endpoint) else {
            print("❌ Invalid Base URL + Endpoint: \(baseURL + endpoint)")
            throw APIError.invalidURL
        }
        
        if let queryItems = queryItems {
            components.queryItems = queryItems
        }
        
        guard let url = components.url else {
            print("❌ Failed to create URL from components")
            throw APIError.invalidURL
        }
        
        let urlString = url.absoluteString
        print("🌐 API Request: \(method.rawValue) \(urlString)")
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        
        // Add auth token if required
        if requiresAuth, let token = KeychainService.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("🔑 Using auth token")
        }
        
        // Add body if present
        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601  // Use ISO8601 for backend
            let jsonData = try encoder.encode(body)
            request.httpBody = jsonData
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("📤 Request Body: \(jsonString)")
            }
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type")
                throw APIError.invalidResponse
            }
            
            print("📥 Response Status: \(httpResponse.statusCode)")
            
            // Print raw response for debugging
            if let responseString = String(data: data, encoding: .utf8) {
                print("📥 Response Data: \(responseString)")
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                print("❌ HTTP Error: \(httpResponse.statusCode)")
                
                if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let needsVerification = errorJson["needsVerification"] as? Bool, needsVerification == true {
                    throw APIError.needsVerification
                }
                if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let serverMessage = (errorJson["error"] as? String) ?? (errorJson["message"] as? String) {
                    throw APIError.serverError(serverMessage)
                }
                
                throw APIError.httpError(httpResponse.statusCode)
            }
            
            let decoder = JSONDecoder()
            let formatter = DateFormatter()
            formatter.calendar = Calendar(identifier: .iso8601)
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone(secondsFromGMT: 0)
            
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let dateString = try container.decode(String.self)
                
                // Try multiple formats
                let formats = [
                    "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ",
                    "yyyy-MM-dd'T'HH:mm:ssZZZZZ",
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    "yyyy-MM-dd'T'HH:mm:ss'Z'"
                ]
                
                for format in formats {
                    formatter.dateFormat = format
                    if let date = formatter.date(from: dateString) {
                        return date
                    }
                }
                
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
            }
            
            do {
                let decoded = try decoder.decode(T.self, from: data)
                print("✅ Successfully decoded response")
                return decoded
            } catch {
                print("❌ Decoding Error: \(error)")
                var errorMessage = "Failed to decode response"
                
                if let decodingError = error as? DecodingError {
                    switch decodingError {
                    case .keyNotFound(let key, let context):
                        errorMessage = "Missing key: \(key.stringValue) in \(context.codingPath)"
                        print("❌ \(errorMessage)")
                    case .typeMismatch(let type, let context):
                        errorMessage = "Type mismatch for type: \(type) in \(context.codingPath)"
                        print("❌ \(errorMessage)")
                    case .valueNotFound(let type, let context):
                        errorMessage = "Value not found for type: \(type) in \(context.codingPath)"
                        print("❌ \(errorMessage)")
                    case .dataCorrupted(let context):
                        errorMessage = "Data corrupted: \(context.debugDescription)"
                        print("❌ \(errorMessage)")
                    @unknown default:
                        errorMessage = "Unknown decoding error: \(error.localizedDescription)"
                        print("❌ \(errorMessage)")
                    }
                }
                throw APIError.decodingError(errorMessage)
            }
        } catch let error as APIError {
            print("❌ API Error: \(error.localizedDescription)")
            throw error
        } catch {
            print("❌ Network Error: \(error.localizedDescription)")
            throw error
        }
    }
}

// MARK: - HTTP Method
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

// MARK: - API Error
enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError(String)
    case unauthorized
    case needsVerification
    case serverError(String)
    case previewNetworkDisabled
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP Error: \(code)"
        case .decodingError(let message):
            return "Decoding Error: \(message)"
        case .unauthorized:
            return "Unauthorized access"
        case .needsVerification:
            return "Needs Verification"
        case .serverError(let message):
            return message
        case .previewNetworkDisabled:
            return "Network requests are disabled in Xcode Preview"
        }
    }
}

// MARK: - API Response Models
struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct MessageResponse: Codable {
    let message: String
}

import Combine

class WebSocketService {
    static let shared = WebSocketService()
    
    private var webSocketTask: URLSessionWebSocketTask?
    private let urlSession = URLSession(configuration: .default)
    
    let messageSubject = PassthroughSubject<Message, Never>()
    
    private init() {}
    
    func connect() {
        guard !AppRuntime.isRunningForPreview else { return }

        guard webSocketTask == nil else { return } // Already connected
        
        // Get base URL from APIService, but replace http/https with ws/wss
        guard let token = KeychainService.shared.getToken() else { return }
        
        let baseHttpUrl = APIService.shared.baseURL
        let wsUrlString = baseHttpUrl.replacingOccurrences(of: "http", with: "ws").replacingOccurrences(of: "/api", with: "")
        
        guard let url = URL(string: wsUrlString) else { return }
        
        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        
        print("🔌 WebSocket Connecting to \(url)")
        
        // Authenticate
        let authMessage: [String: Any] = [
            "type": "auth",
            "token": token
        ]
        
        if let data = try? JSONSerialization.data(withJSONObject: authMessage),
           let string = String(data: data, encoding: .utf8) {
            let message = URLSessionWebSocketTask.Message.string(string)
            webSocketTask?.send(message) { error in
                if let error = error {
                    print("❌ WebSocket Auth Send Error: \(error)")
                }
            }
        }
        
        receiveMessage()
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                print("❌ WebSocket Receive Error: \(error)")
                // Optionally handle reconnect logic here
                self?.webSocketTask = nil
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleIncomingMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleIncomingMessage(text)
                    }
                @unknown default:
                    break
                }
                
                // Continue listening
                self?.receiveMessage()
            }
        }
    }
    
    private func handleIncomingMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        
        do {
            // First decode as a generic dictionary to check type
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let type = json["type"] as? String {
                
                if type == "new_message", let messageDict = json["message"] {
                    // Re-encode and decode just the message part
                    let messageData = try JSONSerialization.data(withJSONObject: messageDict)
                    let decoder = JSONDecoder()
                    
                    // The backend sends ISO8601 strings for dates
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
                    decoder.dateDecodingStrategy = .formatted(dateFormatter)
                    
                    let message = try decoder.decode(Message.self, from: messageData)
                    
                    DispatchQueue.main.async {
                        self.messageSubject.send(message)
                        NotificationCenter.default.post(name: NSNotification.Name("WebSocketNewMessage"), object: nil, userInfo: ["message": message])
                        // Also trigger global unread refresh
                        NotificationCenter.default.post(name: NSNotification.Name("NewMessageReceived"), object: nil)
                    }
                } else if type == "auth_success" {
                    print("✅ WebSocket Authenticated")
                }
            }
        } catch {
            print("❌ WebSocket Decode Error: \(error)")
            print("Raw text: \(text)")
        }
    }
}
